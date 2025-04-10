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
} from "@chakra-ui/react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/app/utils/firebase";
import { UserData } from "@/app/utils/userData";
import UserEditModal from "@/app/components/UserEditModal";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";

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

      const usersData: UserData[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      } as UserData));

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
    setIsModalOpen(true);
  };

  // モーダルを閉じる
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  // ユーザー情報更新後の処理
  const handleUserUpdated = () => {
    fetchUsers();
    setIsModalOpen(false);
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

  return (
    <Container maxW="container.xl" py={6}>
      <Heading as="h1" size="xl" mb={6}>
        ユーザー管理
      </Heading>

      {loading ? (
        <Box textAlign="center" py={10}>
          <Spinner size="xl" />
          <Text mt={4}>ユーザーデータを読み込み中...</Text>
        </Box>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>メールアドレス</Th>
                <Th>氏名</Th>
                <Th>支店</Th>
                <Th>班</Th>
                <Th>権限</Th>
                <Th>操作</Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map((user) => (
                <Tr key={user.id}>
                  <Td>{user.email}</Td>
                  <Td>{user.family_name} {user.name}</Td>
                  <Td>{user.branch || "-"}</Td>
                  <Td>{user.team || "-"}</Td>
                  <Td>
                    <HStack>
                      <RoleBadge role={user.role} />
                    </HStack>
                  </Td>
                  <Td>
                    <Button
                      colorScheme="blue"
                      size="sm"
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
      )}

      <UserEditModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        user={selectedUser}
        onUserUpdated={handleUserUpdated}
      />
    </Container>
  );
}
