// /app/user/register/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  Container,
  CardBody,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  Select,
  Stack,
  InputLeftElement,
  Text,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { FaUserCheck } from "react-icons/fa";
import { RiLockPasswordFill } from "react-icons/ri";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/app/utils/firebase";
import { UserData } from "@/app/utils/userData";
import { useBranches } from "@/app/hooks/useBranches";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [name, setName] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [availableTeams, setAvailableTeams] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { branches, isLoading: isBranchesLoading, error: branchesError } = useBranches();
  const toast = useToast();
  const router = useRouter();

  // 支店が選択されたときに、その支店の班リストを更新
  useEffect(() => {
    if (selectedBranch) {
      const branch = branches.find(b => b.name === selectedBranch);
      setAvailableTeams(branch?.teams || []);
      setSelectedTeam(""); // 支店が変更されたら班の選択をリセット
    } else {
      setAvailableTeams([]);
      setSelectedTeam("");
    }
  }, [selectedBranch, branches]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !familyName || !name || !selectedBranch || !selectedTeam) {
      toast({
        title: "入力エラー",
        description: "すべての項目を入力してください",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Firestoreにユーザー情報を保存
      await setDoc(doc(db, "users", user.uid), {
        email,
        family_name: familyName,
        name,
        branch: selectedBranch,
        team: selectedTeam,
        role: "user",
        created_at: new Date(),
        updated_at: new Date(),
      });

      toast({
        title: "アカウント作成完了",
        description: "ユーザー登録が完了しました",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      router.push("/");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "登録エラー",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isBranchesLoading) {
    return (
      <Container maxW="container.md" py={10}>
        <Flex justify="center" align="center" minH="50vh">
          <Spinner size="xl" color="blue.500" />
        </Flex>
      </Container>
    );
  }

  if (branchesError) {
    return (
      <Container maxW="container.md" py={10}>
        <Alert status="error">
          <AlertIcon />
          {branchesError}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={10}>
      <Stack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading size="lg">新規ユーザー登録</Heading>
          <Text mt={2} color="gray.600">
            必要な情報を入力してアカウントを作成してください
          </Text>
        </Box>

        <Box
          as="form"
          onSubmit={handleSubmit}
          bg="white"
          p={8}
          borderRadius="lg"
          boxShadow="sm"
          border="1px"
          borderColor="gray.100"
        >
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>メールアドレス</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@example.com"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>パスワード</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6文字以上で入力"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>姓</FormLabel>
              <Input
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="姓を入力"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>名</FormLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="名を入力"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>支店</FormLabel>
              <Select
                placeholder="支店を選択"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.name}>
                    {branch.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl isRequired isDisabled={!selectedBranch}>
              <FormLabel>所属班</FormLabel>
              <Select
                placeholder="班を選択"
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
              >
                {availableTeams.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </Select>
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              width="full"
              mt={6}
              isLoading={isLoading}
              loadingText="登録中..."
            >
              登録
            </Button>

            <Button
              variant="ghost"
              width="full"
              onClick={() => router.push("/user/login")}
            >
              ログインページへ戻る
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
};

export default Register;
