"use client";

import { useEffect, useState } from "react";
import {
  Box,
  SimpleGrid,
  Text,
  useColorModeValue,
  Spinner,
  Center,
  Card,
  CardBody,
  Icon,
  VStack,
} from "@chakra-ui/react";
import { FiUsers, FiMap, FiDatabase } from "react-icons/fi";
import { useRouter } from "next/navigation";
import AdminLayout from "../components/layouts/AdminLayout";
import { auth } from "../utils/firebase";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../utils/firebase";

interface AdminCardProps {
  title: string;
  description: string;
  icon: any;
  href: string;
}

const AdminCard = ({ title, description, icon, href }: AdminCardProps) => {
  const router = useRouter();
  
  return (
    <Card
      onClick={() => router.push(href)}
      cursor="pointer"
      _hover={{
        transform: "translateY(-5px)",
        boxShadow: "xl",
      }}
      transition="all 0.2s"
      bg={useColorModeValue("white", "gray.700")}
    >
      <CardBody>
        <VStack spacing={4} align="center">
          <Icon as={icon} w={10} h={10} color="cyan.500" />
          <Text fontWeight="bold" fontSize="xl">
            {title}
          </Text>
          <Text color={useColorModeValue("gray.600", "gray.300")} textAlign="center">
            {description}
          </Text>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/user/login");
        return;
      }

      // Firestoreからユーザー情報を取得
      const userDoc = await getDoc(doc(db, "users", user.uid));
      console.log("userDoc", userDoc);
      const userData = userDoc.data();

      console.log("userData", userData);

      // ユーザーが存在し、roleがadminの場合のみアクセス可能
      if (userData && userData.role === "admin") {
        console.log("ユーザーが存在します");
        setIsAuthorized(true);
      } else {
        console.log("ユーザーが存在しません");
        setIsAuthorized(false);
      }
      console.log("isAuthorized", isAuthorized);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (isLoading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="cyan.500" />
      </Center>
    );
  }

  if (!isAuthorized) {
    router.push("/");
    return null;
  }

  const adminCards = [
    {
      title: "ユーザー管理",
      description: "ユーザーの権限設定と管理を行います",
      icon: FiUsers,
      href: "/admin/users",
    },
    {
      title: "支店管理",
      description: "支店情報の確認と編集を行います",
      icon: FiMap,
      href: "/admin/branches",
    },
    {
      title: "データ確認",
      description: "勤怠データの確認と分析を行います",
      icon: FiDatabase,
      href: "/admin/viewdata",
    },
  ];

  return (
    <AdminLayout>
      <Box maxW="7xl" mx="auto" px={{ base: 4, sm: 6, lg: 8 }}>
        <Text
          fontSize="2xl"
          fontWeight="bold"
          mb={8}
          color={useColorModeValue("gray.700", "white")}
        >
          管理者ダッシュボード
        </Text>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
          {adminCards.map((card) => (
            <AdminCard key={card.title} {...card} />
          ))}
        </SimpleGrid>
      </Box>
    </AdminLayout>
  );
} 