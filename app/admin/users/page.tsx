"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useDisclosure,
  useToast,
  Text,
  Spinner,
  useColorModeValue,
  Stack,
  Card,
  CardBody,
  VStack,
  HStack,
  Badge,
  useBreakpointValue,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
} from "@chakra-ui/react";
import { AddIcon, EditIcon, SearchIcon } from "@chakra-ui/icons";
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/app/utils/firebase";
import { useRouter } from "next/navigation";
import UserEditModal from "@/app/components/UserEditModal";
import AdminLayout from "@/app/components/layouts/AdminLayout";

interface User {
  id: string;
  email: string;
  family_name?: string;
  name: string;
  role: "admin" | "manager" | "user" | "viewer";
  branch?: string;
  team?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

type UserRole = "admin" | "manager" | "user" | "viewer";

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const router = useRouter();
  const isMobile = useBreakpointValue({ base: true, md: false });

  // カラーモードの値を事前に定義
  const textColor = useColorModeValue("gray.700", "white");
  const subTextColor = useColorModeValue("gray.600", "gray.400");
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBorderColor = useColorModeValue("gray.300", "gray.600");

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let result = users;
    
    // 名前での検索
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user => {
        const fullName = `${user.family_name || ''} ${user.name || ''}`.toLowerCase();
        const email = user.email.toLowerCase();
        return fullName.includes(query) || email.includes(query);
      });
    }
    
    // 権限でのフィルタリング
    if (selectedRole !== 'all') {
      result = result.filter(user => user.role === selectedRole);
    }
    
    setFilteredUsers(result);
  }, [searchQuery, selectedRole, users]);

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, orderBy("name", "asc"));
      const querySnapshot = await getDocs(q);
      const userData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];

      // 権限の優先順位を定義
      const rolePriority: Record<UserRole, number> = {
        admin: 4,
        manager: 3,
        user: 2,
        viewer: 1
      };

      // 権限の高い順にソート
      const sortedUsers = userData.sort((a, b) => {
        const roleDiff = (rolePriority[b.role] || 0) - (rolePriority[a.role] || 0);
        if (roleDiff !== 0) return roleDiff;
        // 権限が同じ場合は名前でソート
        return `${a.family_name || ''}${a.name}`.localeCompare(`${b.family_name || ''}${b.name}`);
      });

      setUsers(sortedUsers);
      setFilteredUsers(sortedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "ユーザー情報の取得に失敗しました",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    onOpen();
  };

  const handleUserUpdated = () => {
    fetchUsers();
    onClose();
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <Flex justify="center" align="center" minH="50vh">
          <Spinner size="xl" color="blue.500" />
        </Flex>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box maxW="7xl" mx="auto" px={{ base: 4, sm: 6, lg: 8 }}>
        <Flex 
          direction={{ base: "column", md: "row" }}
          justify="space-between" 
          align={{ base: "stretch", md: "center" }} 
          mb={6}
          gap={4}
        >
          <Box>
            <Text
              fontSize={{ base: "xl", md: "2xl" }}
              fontWeight="bold"
              color={textColor}
            >
              ユーザー管理
            </Text>
            <Text 
              color={subTextColor}
              fontSize={{ base: "sm", md: "md" }}
            >
              ユーザー情報の確認・編集ができます
            </Text>
          </Box>
        </Flex>

        {/* 検索とフィルター */}
        <Stack
          direction={{ base: "column", md: "row" }}
          spacing={4}
          mb={6}
          align={{ base: "stretch", md: "center" }}
        >
          <InputGroup maxW={{ base: "full", md: "md" }}>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="名前またはメールアドレスで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              bg={bgColor}
              borderColor={borderColor}
              _hover={{
                borderColor: hoverBorderColor,
              }}
              _focus={{
                borderColor: "blue.500",
                boxShadow: "0 0 0 1px blue.500",
              }}
            />
          </InputGroup>
          <Select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            maxW={{ base: "full", md: "xs" }}
            bg={bgColor}
            borderColor={borderColor}
            _hover={{
              borderColor: hoverBorderColor,
            }}
            _focus={{
              borderColor: "blue.500",
              boxShadow: "0 0 0 1px blue.500",
            }}
          >
            <option value="all">すべての権限</option>
            <option value="admin">管理者</option>
            <option value="manager">マネージャー</option>
            <option value="user">一般ユーザー</option>
            <option value="viewer">閲覧者</option>
          </Select>
        </Stack>

        {/* 検索結果のカウント */}
        <Text mb={4} color={subTextColor}>
          {filteredUsers.length}人のユーザーが見つかりました
        </Text>

        {isMobile ? (
          <Stack spacing={4}>
            {filteredUsers.map((user) => (
              <Card 
                key={user.id}
                bg={bgColor}
                shadow="md"
                rounded="lg"
                borderWidth="1px"
                borderColor={borderColor}
              >
                <CardBody>
                  <VStack align="stretch" spacing={3}>
                    <HStack justify="space-between">
                      <Box>
                        <Text fontWeight="bold" fontSize="lg">
                          {user.family_name} {user.name}
                        </Text>
                        <Text fontSize="sm" color={subTextColor}>
                          {user.email}
                        </Text>
                      </Box>
                      <IconButton
                        aria-label="Edit user"
                        icon={<EditIcon />}
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        colorScheme="blue"
                        variant="ghost"
                      />
                    </HStack>
                    <Box>
                      <Text fontSize="sm" color={subTextColor} mb={1}>
                        権限
                      </Text>
                      <Badge 
                        colorScheme={
                          user.role === "admin" ? "red" :
                          user.role === "manager" ? "orange" :
                          user.role === "viewer" ? "purple" : "blue"
                        }
                      >
                        {user.role === "admin" ? "ADMIN" :
                         user.role === "manager" ? "MANAGER" :
                         user.role === "viewer" ? "VIEWER" : "USER"}
                      </Badge>
                    </Box>
                    {(user.branch || user.team) && (
                      <Box>
                        <Text fontSize="sm" color={subTextColor} mb={1}>
                          所属
                        </Text>
                        <Text fontSize="sm">
                          {user.branch} {user.team && `- ${user.team}`}
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </Stack>
        ) : (
          <Box
            bg={bgColor}
            shadow="lg"
            rounded="lg"
            overflow="hidden"
            borderWidth="1px"
            borderColor={borderColor}
          >
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>名前</Th>
                  <Th>メールアドレス</Th>
                  <Th>権限</Th>
                  <Th>所属</Th>
                  <Th>操作</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredUsers.map((user) => (
                  <Tr key={user.id}>
                    <Td>
                      <Text fontWeight="medium">
                        {user.family_name} {user.name}
                      </Text>
                    </Td>
                    <Td>{user.email}</Td>
                    <Td>
                      <Badge 
                        colorScheme={
                          user.role === "admin" ? "red" :
                          user.role === "manager" ? "orange" :
                          user.role === "viewer" ? "purple" : "blue"
                        }
                      >
                        {user.role === "admin" ? "ADMIN" :
                         user.role === "manager" ? "MANAGER" :
                         user.role === "viewer" ? "VIEWER" : "USER"}
                      </Badge>
                    </Td>
                    <Td>
                      {user.branch && (
                        <Text>
                          {user.branch} {user.team && `- ${user.team}`}
                        </Text>
                      )}
                    </Td>
                    <Td>
                      <IconButton
                        aria-label="Edit user"
                        icon={<EditIcon />}
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        colorScheme="blue"
                        variant="ghost"
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </Box>

      <UserEditModal
        isOpen={isOpen}
        onClose={onClose}
        user={selectedUser}
        onUserUpdated={handleUserUpdated}
      />
    </AdminLayout>
  );
}
