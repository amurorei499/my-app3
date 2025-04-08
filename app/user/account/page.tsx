// /app/user/account/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardBody,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useToast,
} from "@chakra-ui/react";
import {
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "firebase/auth";
import { auth } from "@/app/utils/firebase";

const AccountSettings = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
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
  }, []);

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
        description: `${error}`,
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
        description: `${error}`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex justifyContent="center" mx="auto" p={5}>
      <Card maxW="md" w="100%" boxShadow="lg">
        <CardBody>
          <Tabs isFitted variant="enclosed" colorScheme="teal" index={1}>
            <TabList mb="1em">
              <Tab onClick={() => router.push("/user/profile")}>プロフィール情報</Tab>
              <Tab>アカウント設定</Tab>
            </TabList>
            <TabPanels>
              <TabPanel></TabPanel>
              <TabPanel>
                <Heading size="md" mb={4} textAlign="center">
                  アカウント設定
                </Heading>

                {/* メールアドレス変更セクション */}
                <Box mb={6}>
                  <Heading size="sm" mb={2}>
                    メールアドレス変更
                  </Heading>
                  <FormControl mb={3}>
                    <FormLabel>新しいメールアドレス</FormLabel>
                    <Input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </FormControl>
                  <FormControl mb={3}>
                    <FormLabel>現在のパスワード（確認用）</FormLabel>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="現在のパスワードを入力"
                    />
                  </FormControl>
                  <Button
                    colorScheme="teal"
                    isLoading={loading}
                    onClick={handleEmailUpdate}
                  >
                    メールアドレスを更新
                  </Button>
                </Box>

                <Divider my={4} />

                {/* パスワード変更セクション */}
                <Box>
                  <Heading size="sm" mb={2}>
                    パスワード変更
                  </Heading>
                  <FormControl mb={3}>
                    <FormLabel>現在のパスワード</FormLabel>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </FormControl>
                  <FormControl mb={3}>
                    <FormLabel>新しいパスワード</FormLabel>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </FormControl>
                  <FormControl mb={3}>
                    <FormLabel>新しいパスワード（確認）</FormLabel>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </FormControl>
                  <Button
                    colorScheme="teal"
                    isLoading={loading}
                    onClick={handlePasswordUpdate}
                  >
                    パスワードを更新
                  </Button>
                </Box>

                <Button
                  variant="outline"
                  onClick={() => router.push("/")}
                  mt={6}
                  w="100%"
                >
                  メイン画面に戻る
                </Button>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>
    </Flex>
  );
};

export default AccountSettings;
