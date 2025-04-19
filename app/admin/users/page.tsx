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
  const [isModalOpen, setIsModalOpen] = useState(false);
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
                <Th color={useColorModeValue("gray.600", "gray.200")}>名前</Th>
                <Th color={useColorModeValue("gray.600", "gray.200")}>メールアドレス</Th>
                <Th color={useColorModeValue("gray.600", "gray.200")}>権限</Th>
                <Th color={useColorModeValue("gray.600", "gray.200")}>作成日</Th>
                <Th color={useColorModeValue("gray.600", "gray.200")}>更新日</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map((user) => (
                <Tr 
                  key={user.id}
                  _hover={{ bg: useColorModeValue("gray.50", "gray.700") }}
                >
                  <Td color={useColorModeValue("gray.700", "gray.300")}>{user.name}</Td>
                  <Td color={useColorModeValue("gray.700", "gray.300")}>{user.email}</Td>
                  <Td color={useColorModeValue("gray.700", "gray.300")}>
                    <HStack>
                      <RoleBadge role={user.role} />
                    </HStack>
                  </Td>
                  <Td>
                    {user.created_at && (
                      user.created_at instanceof Timestamp
                        ? user.created_at.toDate().toLocaleString()
                        : new Date(user.created_at).toLocaleString()
                    )}
                  </Td>
                  <Td>
                    {user.updated_at && (
                      user.updated_at instanceof Timestamp
                        ? user.updated_at.toDate().toLocaleString()
                        : new Date(user.updated_at).toLocaleString()
                    )}
                  </Td>
                  <Td>
                    <Button
                      colorScheme="cyan"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                      _hover={{ transform: "translateY(-2px)" }}
                      transition="all 0.2s"
                    >
                      編集
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

        {selectedUser && (
          <UserEditModal
            isOpen={isOpen}
            onClose={handleCloseModal}
            user={selectedUser}
            onUserUpdated={handleUserUpdated}
          />
        )}
      </Box>
    </AdminLayout>
  );
}
