"use client";

// app/components/layouts/AdminLayout.tsx

import { ReactNode, useState, useEffect } from "react";
import {
  Box,
  Flex,
  IconButton,
  useColorModeValue,
  Text,
  CloseButton,
  BoxProps,
  FlexProps,
  Drawer,
  DrawerContent,
  useDisclosure,
  Stack,
  Spinner,
} from "@chakra-ui/react";
import {
  FiMenu,
  FiUsers,
  FiMap,
  FiDatabase,
  FiHome,
} from "react-icons/fi";
import { IconType } from "react-icons";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/app/utils/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/utils/firebase";

interface LinkItemProps {
  name: string;
  icon: IconType;
  href: string;
}

const LinkItems: Array<LinkItemProps> = [
  { name: "ダッシュボード", icon: FiHome, href: "/admin" },
  { name: "ユーザー管理", icon: FiUsers, href: "/admin/users" },
  { name: "支店管理", icon: FiMap, href: "/admin/branches" },
  { name: "データ確認", icon: FiDatabase, href: "/admin/viewdata" },
  { name: "勤怠管理", icon: FiHome, href: "/" },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

const TEST_ADMIN_UID = "RwHDYu1wkPVrRUJ13kiMMFrB9E72";

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/");
        return;
      }

      try {
        // テスト管理者UIDのチェック
        if (user.uid === TEST_ADMIN_UID) {
          setIsAuthorized(true);
          setIsLoading(false);
          return;
        }

        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();

        if (userData?.role === "admin") {
          setIsAuthorized(true);
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (isLoading) {
    return (
      <Box
        minH="100vh"
        bg={useColorModeValue("gray.50", "gray.900")}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Flex direction="column" align="center" gap={4}>
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color="blue.500"
            size="xl"
          />
          <Text
            color={useColorModeValue("gray.600", "gray.400")}
            fontSize="sm"
          >
            権限を確認中...
          </Text>
        </Flex>
      </Box>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <Box minH="100vh" bg={useColorModeValue("gray.100", "gray.900")}>
      <SidebarContent
        onClose={() => onClose}
        display={{ base: "none", md: "block" }}
      />
      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerContent>
          <SidebarContent onClose={onClose} />
        </DrawerContent>
      </Drawer>
      {/* モバイルナビゲーション */}
      <MobileNav onOpen={onOpen} />
      <Box ml={{ base: 0, md: 60 }} p="4">
        {children}
      </Box>
    </Box>
  );
}

interface SidebarProps extends BoxProps {
  onClose: () => void;
}

const SidebarContent = ({ onClose, ...rest }: SidebarProps) => {
  const pathname = usePathname();
  
  return (
    <Box
      transition="3s ease"
      bg={useColorModeValue("white", "gray.900")}
      borderRight="1px"
      borderRightColor={useColorModeValue("gray.200", "gray.700")}
      w={{ base: "full", md: 60 }}
      pos="fixed"
      h="full"
      {...rest}
    >
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Text fontSize="2xl" fontWeight="bold">
          管理画面
        </Text>
        <CloseButton display={{ base: "flex", md: "none" }} onClick={onClose} />
      </Flex>
      {LinkItems.map((link) => (
        <NavItem
          key={link.name}
          icon={link.icon}
          href={link.href}
          isActive={pathname === link.href}
        >
          {link.name}
        </NavItem>
      ))}
    </Box>
  );
};

interface NavItemProps extends FlexProps {
  icon: IconType;
  children: ReactNode;
  href: string;
  isActive?: boolean;
}

const NavItem = ({ icon, children, href, isActive, ...rest }: NavItemProps) => {
  const isMainPage = href === "/";
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        bg={isActive ? "cyan.400" : "transparent"}
        color={isMainPage ? "red.400" : isActive ? "white" : "inherit"}
        _hover={{
          bg: isMainPage ? "red.400" : "cyan.400",
          color: "white",
        }}
        {...rest}
      >
        {icon && (
          <Box mr="4" color={isMainPage ? "red.400" : "inherit"}>
            {icon({
              size: 16,
            })}
          </Box>
        )}
        {children}
      </Flex>
    </Link>
  );
};

interface MobileProps extends FlexProps {
  onOpen: () => void;
}

const MobileNav = ({ onOpen, ...rest }: MobileProps) => {
  return (
    <Flex
      ml={{ base: 0, md: 60 }}
      px={{ base: 4, md: 4 }}
      height="20"
      alignItems="center"
      bg={useColorModeValue("white", "gray.900")}
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue("gray.200", "gray.700")}
      justifyContent={{ base: "space-between", md: "flex-end" }}
      {...rest}
    >
      <IconButton
        display={{ base: "flex", md: "none" }}
        onClick={onOpen}
        variant="outline"
        aria-label="メニューを開く"
        icon={<FiMenu />}
      />

      <Text
        display={{ base: "flex", md: "none" }}
        fontSize="2xl"
        fontWeight="bold"
      >
        管理画面
      </Text>

      <Stack direction="row" spacing={4} align="center">
        {/* ここに必要に応じてヘッダーの追加要素を配置できます */}
      </Stack>
    </Flex>
  );
}; 