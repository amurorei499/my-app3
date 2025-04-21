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
  const isMobile = useBreakpointValue({ base: true, md: false });
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.700", "white");
  const subTextColor = useColorModeValue("gray.600", "gray.400");

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

  const handleBranchUpdated = () => {
    fetchBranches();
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
              支店情報管理
            </Text>
            <Text 
              color={subTextColor}
              fontSize={{ base: "sm", md: "md" }}
            >
              支店情報の確認・編集ができます
            </Text>
          </Box>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="cyan"
            onClick={handleAddBranch}
            width={{ base: "full", md: "auto" }}
          >
            支店を追加
          </Button>
        </Flex>

        {isMobile ? (
          <Stack spacing={4}>
            {branches.map((branch) => (
              <Card 
                key={branch.id}
                bg={bgColor}
                shadow="md"
                rounded="lg"
                borderWidth="1px"
                borderColor={borderColor}
              >
                <CardBody>
                  <VStack align="stretch" spacing={3}>
                    <HStack justify="space-between">
                      <Text fontWeight="bold" fontSize="lg">
                        {branch.name}
                      </Text>
                      <IconButton
                        aria-label="Edit branch"
                        icon={<EditIcon />}
                        size="sm"
                        onClick={() => handleEditBranch(branch)}
                        colorScheme="blue"
                        variant="ghost"
                      />
                    </HStack>
                    <Box>
                      <Text fontSize="sm" color={subTextColor} mb={1}>
                        所属班
                      </Text>
                      <Flex wrap="wrap" gap={2}>
                        {branch.teams.map((team) => (
                          <Badge 
                            key={team}
                            colorScheme="blue"
                            variant="subtle"
                          >
                            {team}
                          </Badge>
                        ))}
                      </Flex>
                    </Box>
                    {branch.latitude && branch.longitude && (
                      <Box>
                        <Text fontSize="sm" color={subTextColor}>
                          位置情報
                        </Text>
                        <Text fontSize="sm">
                          緯度: {branch.latitude}, 経度: {branch.longitude}
                        </Text>
                        {branch.radius && (
                          <Text fontSize="sm">
                            許容範囲: {branch.radius}m
                          </Text>
                        )}
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
                  <Th>支店名</Th>
                  <Th>所属班</Th>
                  <Th>位置情報</Th>
                  <Th>操作</Th>
                </Tr>
              </Thead>
              <Tbody>
                {branches.map((branch) => (
                  <Tr key={branch.id}>
                    <Td fontWeight="medium">{branch.name}</Td>
                    <Td>
                      <Flex wrap="wrap" gap={2}>
                        {branch.teams.map((team) => (
                          <Badge 
                            key={team}
                            colorScheme="blue"
                            variant="subtle"
                          >
                            {team}
                          </Badge>
                        ))}
                      </Flex>
                    </Td>
                    <Td>
                      {branch.latitude && branch.longitude ? (
                        <VStack align="start" spacing={1}>
                          <Text fontSize="sm">
                            緯度: {branch.latitude}
                          </Text>
                          <Text fontSize="sm">
                            経度: {branch.longitude}
                          </Text>
                          {branch.radius && (
                            <Text fontSize="sm">
                              許容範囲: {branch.radius}m
                            </Text>
                          )}
                        </VStack>
                      ) : (
                        <Text fontSize="sm" color={subTextColor}>
                          未設定
                        </Text>
                      )}
                    </Td>
                    <Td>
                      <IconButton
                        aria-label="Edit branch"
                        icon={<EditIcon />}
                        size="sm"
                        onClick={() => handleEditBranch(branch)}
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

      <BranchEditModal
        isOpen={isOpen}
        onClose={onClose}
        branch={selectedBranch}
        onBranchUpdated={handleBranchUpdated}
      />
    </AdminLayout>
  );
} 