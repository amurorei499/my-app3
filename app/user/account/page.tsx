// /app/user/account/page.tsx
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
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Divider,
  useToast,
  IconButton,
  FormHelperText,
} from "@chakra-ui/react";
import {
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "firebase/auth";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { auth } from "@/app/utils/firebase";

const AccountSettings = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    // ユーザーがログインしているか確認
    const user = auth.currentUser;
    if (!user) {
      router.push("/user/login");
    } else if (user.email) {
      setNewEmail(user.email);
    }
  }, [router]);

  // 現在のユーザーを再認証
  const reauthenticate = async (password: string) => {
    const user = auth.currentUser;
    if (!user || !user.email) return false;

    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      return true;
    } catch (error) {
      console.error("再認証エラー:", error);
      return false;
    }
  };

  // メールアドレス更新処理
  const handleEmailUpdate = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("ユーザーがログインしていません");
      }

      // 現在のパスワードで再認証
      const isAuthenticated = await reauthenticate(currentPassword);
      if (!isAuthenticated) {
        throw new Error("現在のパスワードが正しくありません");
      }

      // メールアドレス更新
      await updateEmail(user, newEmail);

      toast({
        title: "メールアドレスを更新しました",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setCurrentPassword("");
    } catch (error) {
      console.error("メールアドレス更新エラー:", error);
      toast({
        title: "メールアドレス更新に失敗しました",
        description: error instanceof Error ? error.message : "エラーが発生しました",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // パスワード更新処理
  const handlePasswordUpdate = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("ユーザーがログインしていません");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("新しいパスワードと確認用パスワードが一致しません");
      }

      if (newPassword.length < 6) {
        throw new Error("パスワードは6文字以上である必要があります");
      }

      // 現在のパスワードで再認証
      const isAuthenticated = await reauthenticate(currentPassword);
      if (!isAuthenticated) {
        throw new Error("現在のパスワードが正しくありません");
      }

      // パスワード更新
      await updatePassword(user, newPassword);

      toast({
        title: "パスワードを更新しました",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("パスワード更新エラー:", error);
      toast({
        title: "パスワード更新に失敗しました",
        description: error instanceof Error ? error.message : "エラーが発生しました",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="#121212" py={8}>
      <Box
        maxW="800px"
        mx="auto"
        bg="#1A1A1A"
        borderRadius="lg"
        overflow="hidden"
        boxShadow="xl"
      >
        <Tabs variant="enclosed" colorScheme="cyan">
          <TabList bg="#232323">
            <Tab
              _selected={{ bg: "#1A1A1A", color: "cyan.400", borderBottomColor: "cyan.400" }}
              color="gray.300"
              px={8}
              py={4}
              onClick={() => router.push("/user/profile")}
            >
              プロフィール情報
            </Tab>
            <Tab
              _selected={{ bg: "#1A1A1A", color: "cyan.400", borderBottomColor: "cyan.400" }}
              color="gray.300"
              px={8}
              py={4}
            >
              アカウント設定
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel p={0}></TabPanel>
            <TabPanel p={6}>
              <Box>
                <Text fontSize="xl" fontWeight="bold" color="white" mb={2}>アカウント情報</Text>
                <Text fontSize="sm" color="gray.400" mb={6}>ログインに使用される情報です</Text>

                <Divider mb={6} borderColor="gray.700" />

                {/* メールアドレス変更セクション */}
                <FormControl as={Flex} alignItems="center" py={4} borderBottom="1px solid" borderColor="gray.700">
                  <FormLabel w="160px" color="gray.300" m={0}>メールアドレス</FormLabel>
                  <Flex flex={1} direction="column">
                    <InputGroup>
                      <Input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        bg="#2D2D2D"
                        border="none"
                        color="white"
                      />
                    </InputGroup>
                    <FormControl mt={3}>
                      <FormLabel fontSize="sm" color="gray.400">現在のパスワード（確認用）</FormLabel>
                      <InputGroup>
                        <Input
                          type={showPasswords.current ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="現在のパスワードを入力"
                          bg="#2D2D2D"
                          border="none"
                          color="white"
                        />
                        <InputRightElement>
                          <IconButton
                            aria-label="パスワードを表示/非表示"
                            icon={showPasswords.current ? <ViewOffIcon /> : <ViewIcon />}
                            variant="ghost"
                            colorScheme="gray"
                            size="sm"
                            onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                          />
                        </InputRightElement>
                      </InputGroup>
                    </FormControl>
                    <Button
                      colorScheme="cyan"
                      mt={3}
                      isLoading={loading}
                      onClick={handleEmailUpdate}
                    >
                      メールアドレスを更新
                    </Button>
                  </Flex>
                </FormControl>

                {/* パスワード変更セクション */}
                <FormControl as={Flex} alignItems="start" py={4} borderBottom="1px solid" borderColor="gray.700">
                  <FormLabel w="160px" color="gray.300" m={0} pt={2}>パスワード</FormLabel>
                  <Flex flex={1} direction="column">
                    <Text color="white" mb={3}>********</Text>

                    <Divider mb={3} borderColor="gray.700" />

                    <FormControl mb={3}>
                      <FormLabel fontSize="sm" color="gray.400">現在のパスワード</FormLabel>
                      <InputGroup>
                        <Input
                          type={showPasswords.current ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          bg="#2D2D2D"
                          border="none"
                          color="white"
                        />
                        <InputRightElement>
                          <IconButton
                            aria-label="パスワードを表示/非表示"
                            icon={showPasswords.current ? <ViewOffIcon /> : <ViewIcon />}
                            variant="ghost"
                            colorScheme="gray"
                            size="sm"
                            onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                          />
                        </InputRightElement>
                      </InputGroup>
                    </FormControl>

                    <FormControl mb={3}>
                      <FormLabel fontSize="sm" color="gray.400">新しいパスワード</FormLabel>
                      <InputGroup>
                        <Input
                          type={showPasswords.new ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          bg="#2D2D2D"
                          border="none"
                          color="white"
                        />
                        <InputRightElement>
                          <IconButton
                            aria-label="パスワードを表示/非表示"
                            icon={showPasswords.new ? <ViewOffIcon /> : <ViewIcon />}
                            variant="ghost"
                            colorScheme="gray"
                            size="sm"
                            onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                          />
                        </InputRightElement>
                      </InputGroup>
                      <FormHelperText color="gray.500">6文字以上入力してください</FormHelperText>
                    </FormControl>

                    <FormControl mb={3}>
                      <FormLabel fontSize="sm" color="gray.400">新しいパスワード（確認）</FormLabel>
                      <InputGroup>
                        <Input
                          type={showPasswords.confirm ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          bg="#2D2D2D"
                          border="none"
                          color="white"
                        />
                        <InputRightElement>
                          <IconButton
                            aria-label="パスワードを表示/非表示"
                            icon={showPasswords.confirm ? <ViewOffIcon /> : <ViewIcon />}
                            variant="ghost"
                            colorScheme="gray"
                            size="sm"
                            onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                          />
                        </InputRightElement>
                      </InputGroup>
                    </FormControl>

                    <Button
                      colorScheme="cyan"
                      isLoading={loading}
                      onClick={handlePasswordUpdate}
                    >
                      パスワードを更新
                    </Button>
                  </Flex>
                </FormControl>

                <Box textAlign="center" mt={8}>
                  <Button
                    onClick={() => router.push("/")}
                    colorScheme="gray"
                    size="md"
                    px={8}
                    variant="ghost"
                  >
                    戻る
                  </Button>
                </Box>
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  );
};

export default AccountSettings;
