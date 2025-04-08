// /app/user/sendReset/page.tsx

"use client";

import { auth } from "@/app/utils/firebase";
import {
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaUserCheck } from "react-icons/fa";
import { RiMailSendLine } from "react-icons/ri";

const SendReset = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const router = useRouter();
  const toast = useToast();

  // 入力値変更時の処理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  //パスワードリセット申請処理
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // パスワードリセットメール送信
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "パスワード設定メールを確認してください",
        position: "top",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      router.push("/user/login"); // sendPasswordResetEmailが成功した場合にのみページ遷移
    } catch (error: unknown) {
      console.error("Error during password reset:", error);
      toast({
        title: "パスワード更新に失敗しました",
        description: `${error}`,
        position: "top",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Flex alignItems="center" justify="center" p={5}>
        <Card px={5}>
          <Heading size="md" textAlign="center" mt={4}>
            パスワードリセット申請
          </Heading>
          <Text textAlign="center" fontSize="12px" color="gray">
            入力したメールアドレス宛にパスワードリセットURLの案内をお送りします。
          </Text>
          <CardBody w={{ base: "xs", md: "lg" }}>
            <form onSubmit={handleResetPassword}>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FaUserCheck color="gray" />
                </InputLeftElement>
                <Input
                  autoFocus
                  type="email"
                  placeholder="登録メールアドレスを入力"
                  name="email"
                  value={email}
                  required
                  mb={2}
                  onChange={handleInputChange}
                />
              </InputGroup>
              <Box mt={4} mb={2} textAlign="center">
                <Button
                  type="submit"
                  isLoading={loading}
                  loadingText="Loading"
                  spinnerPlacement="start"
                  colorScheme="green"
                  mx={2}
                >
                  <Stack mr={2}>
                    <RiMailSendLine />
                  </Stack>
                  リセット申請する
                </Button>
                <Button colorScheme="gray" onClick={() => router.back()} mx={2}>
                  戻る
                </Button>
              </Box>
            </form>
          </CardBody>
        </Card>
      </Flex>
    </>
  );
};
export default SendReset;