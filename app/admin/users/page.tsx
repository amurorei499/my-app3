"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Spinner,
  useToast,
  HStack,
  Text,
  Badge,
  Flex,
  useDisclosure,
  useColorModeValue,
} from "@chakra-ui/react";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/app/utils/firebase";
import { UserData } from "@/app/utils/userData";
import UserEditModal from "@/app/components/UserEditModal";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import AdminLayout from "../../components/layouts/AdminLayout";

interface User {
  id: string;
  email: string;
  role: string;
  name: string;
  created_at: { toDate: () => Date };
  updated_at: { toDate: () => Date };
}

export default function UserManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const toast = useToast();
  const auth = getAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // マウント状態と権限チェック
  useEffect(() => {
    setHasMounted(true);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const idTokenResult = await user.getIdTokenResult(true);
        setIsAdmin(!!idTokenResult.claims.admin);

        if (idTokenResult.claims.admin) {
          await fetchUsers();
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error("権限確認エラー:", error);
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, []);

  // ユーザーデータ取得
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, "users");
      const querySnapshot = await getDocs(usersRef);

      const usersData: UserData[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email || '',
          family_name: data.family_name || '',
          name: data.name || '',
          role: data.role || 'user',
          branch: data.branch,
          team: data.team,
          created_at: data.created_at || Timestamp.now(),
          updated_at: data.updated_at || Timestamp.now()
        };
      });

      setUsers(usersData);
    } catch (error) {
      console.error("ユーザーデータ取得エラー:", error);
      toast({
        title: "ユーザーデータの取得に失敗しました",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!hasMounted) {
    return null; // サーバーサイドでは何もレンダリングしない
  }

  if (!isAdmin) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="red.500">このページにアクセスする権限がありません</Text>
      </Box>
    );
  }

  // ユーザー編集モーダルを開く
  const handleEditUser = (user: UserData) => {
    setSelectedUser(user);
    onOpen();
  };

  // モーダルを閉じる
  const handleCloseModal = () => {
    onClose();
    setSelectedUser(null);
  };

  // ユーザー情報更新後の処理
  const handleUserUpdated = () => {
    fetchUsers();
    onClose();
    setSelectedUser(null);
    toast({
      title: "ユーザー情報を更新しました",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  // 権限表示用バッジ
  const RoleBadge = ({ role }: { role?: string }) => {
    if (!role) return null;

    const colorScheme =
      role === "admin" ? "red" :
      role === "manager" ? "green" :
      role === "viewer" ? "blue" : "gray";

    return (
      <Badge colorScheme={colorScheme} mr={2}>
        {role}
      </Badge>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minH="60vh">
          <Spinner size="xl" color="cyan.500" />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box maxW="7xl" mx="auto" px={{ base: 4, sm: 6, lg: 8 }} py={8}>
        <Text
          fontSize="2xl"
          fontWeight="bold"
          mb={8}
          color={useColorModeValue("gray.700", "white")}
        >
          ユーザー管理
        </Text>
        
        <Box
          bg={useColorModeValue("white", "gray.800")}
          shadow="lg"
          rounded="lg"
          overflow="hidden"
        >
          <Table variant="simple">
            <Thead bg={useColorModeValue("gray.50", "gray.700")}>
              <Tr>
                <Th>氏名</Th>
                <Th>メールアドレス</Th>
                <Th>権限</Th>
                <Th>操作</Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map((user) => (
                <Tr key={user.id}>
                  <Td>{`${user.family_name || ''} ${user.name || ''}`}</Td>
                  <Td>{user.email}</Td>
                  <Td>
                    <RoleBadge role={user.role} />
                  </Td>
                  <Td>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={() => handleEditUser(user)}
                    >
                      編集
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

        <UserEditModal
          isOpen={isOpen}
          onClose={handleCloseModal}
          user={selectedUser}
          onUserUpdated={handleUserUpdated}
        />
      </Box>
    </AdminLayout>
  );
}
