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
} from "@chakra-ui/react";
import { AddIcon, EditIcon } from "@chakra-ui/icons";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/app/utils/firebase";
import { useRouter } from "next/navigation";
import BranchEditModal from "@/app/components/BranchEditModal";
import AdminLayout from "@/app/components/layouts/AdminLayout";

interface Branch {
  id: string;
  name: string;
  teams: string[];
  latitude?: number;
  longitude?: number;
  radius?: number; // 許容範囲（メートル）
  created_at: Date;
  updated_at: Date;
}

export default function BranchManagementPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<Branch | undefined>();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const router = useRouter();

  // 支店データの取得
  const fetchBranches = async () => {
    try {
      const branchesRef = collection(db, "branches");
      const q = query(branchesRef, orderBy("name", "asc"));
      const querySnapshot = await getDocs(q);
      
      const branchData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate(),
        updated_at: doc.data().updated_at?.toDate()
      })) as Branch[];

      setBranches(branchData);
    } catch (error) {
      console.error("Error fetching branches:", error);
      toast({
        title: "支店情報の取得に失敗しました",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleAddBranch = () => {
    setSelectedBranch(undefined);
    onOpen();
  };

  const handleEditBranch = (branch: Branch) => {
    setSelectedBranch(branch);
    onOpen();
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <Flex minH="60vh" align="center" justify="center">
          <Spinner size="xl" color="cyan.500" />
        </Flex>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box maxW="7xl" mx="auto" px={{ base: 4, sm: 6, lg: 8 }}>
        <Flex justifyContent="space-between" alignItems="center" mb={6}>
          <Box>
            <Text
              fontSize="2xl"
              fontWeight="bold"
              color={useColorModeValue("gray.700", "white")}
            >
              支店情報管理
            </Text>
            <Text color={useColorModeValue("gray.600", "gray.400")}>
              支店情報の確認・編集ができます
            </Text>
          </Box>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="cyan"
            onClick={handleAddBranch}
          >
            支店を追加
          </Button>
        </Flex>

        <Box
          bg={useColorModeValue("white", "gray.800")}
          shadow="lg"
          rounded="lg"
          overflow="hidden"
          borderWidth="1px"
          borderColor={useColorModeValue("gray.200", "gray.700")}
        >
          <Table variant="simple">
            <Thead bg={useColorModeValue("gray.50", "gray.700")}>
              <Tr>
                <Th color={useColorModeValue("gray.600", "gray.200")}>支店名</Th>
                <Th color={useColorModeValue("gray.600", "gray.200")}>所属班</Th>
                <Th color={useColorModeValue("gray.600", "gray.200")}>位置情報</Th>
                <Th color={useColorModeValue("gray.600", "gray.200")}>最終更新日</Th>
                <Th width="100px" color={useColorModeValue("gray.600", "gray.200")}>操作</Th>
              </Tr>
            </Thead>
            <Tbody>
              {branches.map((branch) => (
                <Tr 
                  key={branch.id} 
                  _hover={{ bg: useColorModeValue("gray.50", "gray.700") }}
                >
                  <Td color={useColorModeValue("gray.700", "gray.300")} fontWeight="medium">
                    {branch.name}
                  </Td>
                  <Td color={useColorModeValue("gray.700", "gray.300")}>
                    {branch.teams.join(", ")}
                  </Td>
                  <Td>
                    {branch.latitude && branch.longitude ? (
                      <Text fontSize="sm" color={useColorModeValue("gray.600", "gray.400")}>
                        {branch.latitude.toFixed(6)}, {branch.longitude.toFixed(6)}
                        {branch.radius && ` (範囲: ${branch.radius}m)`}
                      </Text>
                    ) : (
                      <Text fontSize="sm" color={useColorModeValue("gray.400", "gray.500")}>
                        未設定
                      </Text>
                    )}
                  </Td>
                  <Td color={useColorModeValue("gray.700", "gray.300")}>
                    {branch.updated_at?.toLocaleDateString("ja-JP")}
                  </Td>
                  <Td>
                    <IconButton
                      aria-label="支店を編集"
                      icon={<EditIcon />}
                      size="sm"
                      variant="ghost"
                      colorScheme="cyan"
                      onClick={() => handleEditBranch(branch)}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

        <BranchEditModal
          isOpen={isOpen}
          onClose={onClose}
          branch={selectedBranch}
          onBranchUpdated={fetchBranches}
        />
      </Box>
    </AdminLayout>
  );
} 