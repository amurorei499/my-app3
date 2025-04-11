"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useDisclosure,
  useToast,
  IconButton,
  Stack,
  RadioGroup,
  Radio,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon, ChevronLeftIcon } from "@chakra-ui/icons";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  auth,
  db
} from "@/app/utils/firebase";
import {
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "firebase/auth";
import { BranchName, branches, getTeamsByBranch } from "@/app/utils/branchData";

type UserInfoItemProps = {
  label: string;
  value: string;
  onClick?: () => void;
  isDisabled?: boolean;
};

const UserInfoItem = ({ label, value, onClick, isDisabled = false }: UserInfoItemProps) => (
  <Flex
    p={4}
    borderBottomWidth="1px"
    borderColor="rgba(255,255,255,0.1)"
    justify="space-between"
    align="center"
    _hover={{ bg: isDisabled ? undefined : "rgba(255,255,255,0.05)" }}
    cursor={isDisabled ? "not-allowed" : onClick ? "pointer" : "default"}
    onClick={isDisabled ? undefined : onClick}
    opacity={isDisabled ? 0.6 : 1}
  >
    <Text fontSize="sm" color="gray.400">{label}</Text>
    <Flex align="center" gap={2}>
      <Text color="white">{value || "未設定"}</Text>
      {!isDisabled && onClick && <ChevronLeftIcon boxSize={5} color="gray.400" transform="rotate(180deg)" />}
    </Flex>
  </Flex>
);

type EditField = "family_name" | "name" | "branch" | "team" | "email" | "password";

const ProfilePage = () => {
  const [userData, setUserData] = useState({
    email: "",
    family_name: "",
    name: "",
    branch: "",
    team: "",
  });
  const [editField, setEditField] = useState<EditField>("family_name");
  const [editValue, setEditValue] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [availableTeams, setAvailableTeams] = useState<string[]>([]);
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user?.email) {
        router.push("/user/login");
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.email));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData({
          email: user.email,
          family_name: data.family_name || "",
          name: data.name || "",
          branch: data.branch || "",
          team: data.team || "",
        });
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchUserData();
      else router.push("/user/login");
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (userData.branch) {
      setAvailableTeams(getTeamsByBranch(userData.branch as BranchName));
    }
  }, [userData.branch]);

  const openEditModal = (field: EditField, value: string) => {
    setEditField(field);
    setEditValue(value);
    onOpen();
  };

  const handleProfileUpdate = async () => {
    try {
      const user = auth.currentUser;
      if (!user?.email) return;

      await updateDoc(doc(db, "users", user.email), {
        [editField]: editValue,
        ...(editField === "branch" && { team: "" }),
      });

      setUserData((prev) => ({
        ...prev,
        [editField]: editValue,
        ...(editField === "branch" && { team: "" }),
      }));

      toast({
        title: "更新完了",
        status: "success",
        duration: 3000,
      });
      onClose();
    } catch (error) {
      toast({
        title: "更新失敗",
        status: "error",
        duration: 3000,
      });
    }
  };

  const handlePasswordUpdate = async () => {
    try {
      const user = auth.currentUser;
      if (!user?.email) throw new Error("認証エラー");

      if (newPassword !== confirmPassword) throw new Error("パスワードが一致しません");
      if (newPassword.length < 6) throw new Error("6文字以上必要です");

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      toast({
        title: "パスワードを更新しました",
        status: "success",
        duration: 3000,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onClose();
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "エラーが発生しました",
        status: "error",
        duration: 3000,
      });
    }
  };

  return (
    <Box minH="100vh" bg="#121212" color="white">
      {/* ヘッダー */}
      <Flex
        bg="#1A1A1A"
        borderBottom="1px solid"
        borderColor="rgba(255,255,255,0.1)"
        p={4}
        justify="space-between"
        align="center"
      >
        <Button
          leftIcon={<ChevronLeftIcon />}
          colorScheme="cyan"
          variant="ghost"
          onClick={() => router.push("/")}
        >
          メインページに戻る
        </Button>
        <Heading size="md" color="cyan.400">プロフィール設定</Heading>
        <Box w="136px" /> {/* スペーサー */}
      </Flex>

      <Box maxW="800px" mx="auto" p={6}>
        <Tabs variant="enclosed" colorScheme="cyan">
          <TabList borderColor="rgba(255,255,255,0.1)">
            <Tab
              _selected={{ borderColor: "cyan.400", color: "cyan.400" }}
              color="gray.400"
            >
              基本情報
            </Tab>
            <Tab
              _selected={{ borderColor: "cyan.400", color: "cyan.400" }}
              color="gray.400"
            >
              アカウント設定
            </Tab>
          </TabList>

          <TabPanels mt={6}>
            {/* 基本情報タブ */}
            <TabPanel p={0}>
              <Box bg="#1A1A1A" borderRadius="lg" overflow="hidden" boxShadow="xl">
                <UserInfoItem
                  label="姓"
                  value={userData.family_name}
                  onClick={() => openEditModal("family_name", userData.family_name)}
                />
                <UserInfoItem
                  label="名"
                  value={userData.name}
                  onClick={() => openEditModal("name", userData.name)}
                />
                <UserInfoItem
                  label="支店"
                  value={userData.branch}
                  onClick={() => openEditModal("branch", userData.branch)}
                />
                <UserInfoItem
                  label="班"
                  value={userData.team}
                  onClick={() => openEditModal("team", userData.team)}
                  isDisabled={!userData.branch}
                />
              </Box>
            </TabPanel>

            {/* アカウント設定タブ */}
            <TabPanel p={0}>
              <Box bg="#1A1A1A" borderRadius="lg" overflow="hidden" boxShadow="xl">
                <UserInfoItem
                  label="メールアドレス"
                  value={userData.email}
                  onClick={() => openEditModal("email", userData.email)}
                />
                <UserInfoItem
                  label="パスワード"
                  value="********"
                  onClick={() => openEditModal("password", "")}
                />
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* 編集モーダル */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay bg="blackAlpha.700" />
          <ModalContent bg="#1A1A1A" color="white">
            <ModalHeader borderBottom="1px solid" borderColor="rgba(255,255,255,0.1)">
              {editField === "password" ? "パスワード変更" : "情報編集"}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody py={6}>
              {editField === "password" ? (
                <Stack spacing={4}>
                  <FormControl>
                    <FormLabel>現在のパスワード</FormLabel>
                    <InputGroup>
                      <Input
                        type={showPasswords.current ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        bg="#2D2D2D"
                        border="none"
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label="表示切替"
                          icon={showPasswords.current ? <ViewOffIcon /> : <ViewIcon />}
                          variant="ghost"
                          onClick={() => setShowPasswords(p => ({ ...p, current: !p.current }))}
                        />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>
                  <FormControl>
                    <FormLabel>新しいパスワード</FormLabel>
                    <InputGroup>
                      <Input
                        type={showPasswords.new ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        bg="#2D2D2D"
                        border="none"
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label="表示切替"
                          icon={showPasswords.new ? <ViewOffIcon /> : <ViewIcon />}
                          variant="ghost"
                          onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))}
                        />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>
                  <FormControl>
                    <FormLabel>パスワード確認</FormLabel>
                    <InputGroup>
                      <Input
                        type={showPasswords.confirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        bg="#2D2D2D"
                        border="none"
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label="表示切替"
                          icon={showPasswords.confirm ? <ViewOffIcon /> : <ViewIcon />}
                          variant="ghost"
                          onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))}
                        />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>
                </Stack>
              ) : ["branch", "team"].includes(editField) ? (
                <RadioGroup value={editValue} onChange={setEditValue}>
                  <Stack spacing={3}>
                    {(editField === "branch" ? branches : availableTeams).map((item) => (
                      <Radio key={item} value={item} colorScheme="cyan">
                        {item}
                      </Radio>
                    ))}
                  </Stack>
                </RadioGroup>
              ) : (
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  bg="#2D2D2D"
                  border="none"
                  autoFocus
                />
              )}
            </ModalBody>
            <ModalFooter borderTop="1px solid" borderColor="rgba(255,255,255,0.1)">
              <Button color="gray.500" variant="ghost" mr={3} onClick={onClose}>
                キャンセル
              </Button>
              <Button
                colorScheme="cyan"
                onClick={editField === "password" ? handlePasswordUpdate : handleProfileUpdate}
              >
                保存
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Box>
  );
};

export default ProfilePage;
