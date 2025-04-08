// /app/user/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { ChevronRightIcon } from "@chakra-ui/icons";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "@/app/utils/firebase";
import { UserData } from "@/app/utils/userData";

// 情報表示用コンポーネントのプロップス型
type UserInfoItemProps = {
  label: string;
  value: string;
  onClick?: () => void;
};

const UserInfoItem = ({ label, value, onClick }: UserInfoItemProps) => {
  return (
    <Flex
      p={4}
      borderBottomWidth="1px"
      justifyContent="space-between"
      alignItems="center"
      _hover={{ bg: "gray.50" }}
      cursor={onClick ? "pointer" : "default"}
      onClick={onClick}
    >
      <Text fontWeight="medium" color="gray.600">{label}</Text>
      <Flex alignItems="center">
        <Text mr={2}>{value || "未設定"}</Text>
        {onClick && <ChevronRightIcon />}
      </Flex>
    </Flex>
  );
};

// 編集データの型
type EditData = {
  field: keyof typeof fieldMapping;
  value: string;
};

// フィールドマッピング
const fieldMapping = {
  "姓": "family_name",
  "名": "name",
  "支店": "branch",
  "班": "team",
} as const;

const ProfileUpdate = () => {
  const [userData, setUserData] = useState<UserData>({
    email: "",
    family_name: "",
    name: "",
    branch: "",
    team: "",
  });
  const [editData, setEditData] = useState<EditData>({
    field: "姓",
    value: "",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // ユーザーデータの取得（変更なし）
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const user = auth.currentUser;
        if (!user?.email) {
          router.push("/user/login");
          return;
        }

        const userRef = doc(db, "users", user.email);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          setUserData({
            email: user.email,
            family_name: userDoc.data().family_name || "",
            name: userDoc.data().name || "",
            branch: userDoc.data().branch || "",
            team: userDoc.data().team || "",
          });
        }
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

    fetchUserData();
  }, [router, toast]);

  // メイン画面に戻る
  const handleReturn = () => {
    router.push("/");
  };

  // 編集モーダルを開く
  const openEditModal = (field: EditData["field"], value: string) => {
    setEditData({ field, value });
    onOpen();
  };

  // 入力値変更処理
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditData(prev => ({ ...prev, value: e.target.value }));
  };

  // 単一フィールド更新処理
  const handleFieldUpdate = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user?.email) throw new Error("認証情報なし");

      const userRef = doc(db, "users", user.email);
      const fieldName = fieldMapping[editData.field];

      const updateData = {
        [fieldName]: editData.value,
      };

      await setDoc(userRef, updateData, { merge: true });

      setUserData(prev => ({
        ...prev,
        [fieldName]: editData.value
      }));

      toast({
        title: `${editData.field}を更新しました`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (error) {
      console.error("更新エラー:", error);
      toast({
        title: "更新に失敗しました",
        description: error instanceof Error ? error.message : "不明なエラー",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <Card overflow="hidden" boxShadow="md" mb={4}>
        <Tabs isFitted colorScheme="teal">
          <TabList>
            <Tab fontWeight="semibold">プロフィール情報</Tab>
            <Tab fontWeight="semibold">アカウント設定</Tab>
          </TabList>

          <TabPanels>
            {/* プロフィール情報タブ */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Box>
                  <Heading size="md" mb={2}>基本情報</Heading>
                  <Text fontSize="sm" color="gray.500" mb={4}>
                    勤怠管理に使用される基本的な情報です
                  </Text>

                  <Box bg="white" borderRadius="md" boxShadow="sm" overflow="hidden" mb={4}>
                    <UserInfoItem
                      label="姓"
                      value={userData.family_name}
                      onClick={() => openEditModal("姓", userData.family_name)}
                    />
                    <UserInfoItem
                      label="名"
                      value={userData.name}
                      onClick={() => openEditModal("名", userData.name)}
                    />
                    <UserInfoItem
                      label="支店"
                      value={userData.branch}
                      onClick={() => openEditModal("支店", userData.branch)}
                    />
                    <UserInfoItem
                      label="班"
                      value={userData.team}
                      onClick={() => openEditModal("班", userData.team)}
                    />
                  </Box>

                  <Button
                    variant="outline"
                    onClick={handleReturn}
                    size="md"
                    width="100%"
                  >
                    戻る
                  </Button>
                </Box>
              </VStack>
            </TabPanel>

            {/* アカウント設定タブ */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Box>
                  <Heading size="md" mb={2}>アカウント情報</Heading>
                  <Text fontSize="sm" color="gray.500" mb={4}>
                    ログインに使用される情報です
                  </Text>

                  <Box bg="white" borderRadius="md" boxShadow="sm" overflow="hidden" mb={4}>
                    <UserInfoItem
                      label="メールアドレス"
                      value={userData.email}
                      onClick={() => router.push("/user/account")}
                    />
                    <UserInfoItem
                      label="パスワード"
                      value="********"
                      onClick={() => router.push("/user/account")}
                    />
                  </Box>

                  <Button
                    variant="outline"
                    onClick={handleReturn}
                    size="md"
                    width="100%"
                  >
                    戻る
                  </Button>
                </Box>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Card>

      {/* 編集モーダル */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editData.field}の編集</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>{editData.field}</FormLabel>
              <Input
                value={editData.value}
                onChange={handleEditChange}
                autoFocus
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              キャンセル
            </Button>
            <Button
              colorScheme="teal"
              onClick={handleFieldUpdate}
              isLoading={loading}
            >
              保存
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default ProfileUpdate;
