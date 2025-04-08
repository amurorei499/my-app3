// /app/user/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  useToast,
} from "@chakra-ui/react";
import { FaUserCheck } from "react-icons/fa";
import { RiLockPasswordFill } from "react-icons/ri";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/app/utils/firebase";

const Login = () => {
  const [formState, setFormState] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  // 入力値変更時の処理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // ログインボタンクリック時の処理
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userLogin = await signInWithEmailAndPassword(
        auth,
        formState.email,
        formState.password
      );
      console.log("User Logged in:", userLogin);

      toast({
        title: "ログインしました",
        position: "top",
        status: "success",
        duration: 2000,
        isClosable: true,
      });

      router.push("/");
    } catch (error) {
      console.error("ログインエラー:", error);
      toast({
        title: "ログインに失敗しました",
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
    <Flex justifyContent="center" boxSize="fit-content" mx="auto" p={5}>
      <Card size={{ base: "sm", md: "lg" }} p={4}>
        <Heading size="md" textAlign="center">
          ログイン
        </Heading>
        <CardBody>
          <form onSubmit={handleLogin}>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FaUserCheck color="gray" />
              </InputLeftElement>
              <Input
                autoFocus
                type="email"
                placeholder="メールアドレスを入力"
                name="email"
                value={formState.email}
                required
                mb={2}
                onChange={handleInputChange}
              />
            </InputGroup>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <RiLockPasswordFill color="gray" />
              </InputLeftElement>
              <Input
                type="password"
                placeholder="パスワードを入力"
                name="password"
                value={formState.password}
                required
                mb={2}
                onChange={handleInputChange}
              />
            </InputGroup>
            <Box mt={4} mb={2} textAlign="center">
              <Button
                isLoading={loading}
                loadingText="Loading"
                spinnerPlacement="start"
                type="submit"
                colorScheme="green"
                width="100%"
                mb={2}
              >
                ログイン
              </Button>
              <Button
                colorScheme="green"
                width="100%"
                variant="outline"
                onClick={() => router.push("/user/register")}
              >
                新規登録
              </Button>
            </Box>
              <Box mt={4} mb={2} textAlign="center">
              <Stack spacing={3}>
                <Button
                  colorScheme="green"
                  width="100%"
                  variant="ghost"
                  onClick={() => router.push("/user/sendReset")}
                >
                  パスワードをお忘れですか？
                </Button>
              </Stack>
            </Box>
          </form>
        </CardBody>
      </Card>
    </Flex>
  );
};

export default Login;
