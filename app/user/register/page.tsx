// /app/user/register/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  useToast,
} from "@chakra-ui/react";
import { FaUserCheck } from "react-icons/fa";
import { RiLockPasswordFill } from "react-icons/ri";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; // Firestoreをインポート
import { auth, db } from "@/app/utils/firebase"; // dbもインポート
import { UserData } from "@/app/utils/userData"; // UserData型をインポート

const Register = () => {
  const [formState, setFormState] = useState({
    email: "",
    password: "",
    passwordConf: "",
    family_name: "", // 姓を追加
    name: "", // 名を追加
    branch: "", // 支店を追加
    team: "", // チームを追加
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  // input入力値変更時の処理（変更なし）
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  //登録するボタンクリック時処理（修正）
  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // バリデーションチェック
    if (formState.password !== formState.passwordConf) {
      toast({
        title: "パスワードが一致しません",
        position: "top",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      setLoading(false);
      return;
    } else if (formState.password.length < 6) {
      toast({
        title: "パスワードは6文字以上にしてください",
        position: "top",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      setLoading(false);
      return;
    }

    try {
      // 1. Firebase Authenticationでユーザーを作成
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formState.email,
        formState.password
      );

      // 2. 作成したユーザーのuidを取得
      const user = userCredential.user;

      // 3. Firestoreにユーザーデータを保存
      const userData: UserData = {
        email: formState.email,
        family_name: formState.family_name,
        name: formState.name,
        branch: formState.branch,
        team: formState.team,
      };

      // Firestoreにドキュメントを作成（emailをドキュメントIDとして使用）
      await setDoc(doc(db, "users", formState.email), userData);

      console.log("User registered successfully:", userCredential);

      // 成功メッセージを表示
      toast({
        title: "ユーザー登録が完了しました",
        position: "top",
        status: "success",
        duration: 2000,
        isClosable: true,
      });

      // メインページに遷移
      router.push("/");

    } catch (error: unknown) {
      console.error("Registration error:", error);
      toast({
        title: "ユーザー登録に失敗しました",
        description: error instanceof Error ? error.message : "不明なエラーが発生しました",
        position: "top",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Flex justifyContent="center" boxSize="fit-content" mx="auto" p={5}>
        <Card size={{ base: "sm", md: "lg" }} p={4}>
          <Heading size="md" textAlign="center" mb={4}>
            ユーザー登録
          </Heading>
          <CardBody>
            <form onSubmit={handleSignup}>
              {/* ユーザー情報入力フィールドを追加 */}
              <FormControl mb={3}>
                <FormLabel>姓</FormLabel>
                <Input
                  name="family_name"
                  value={formState.family_name}
                  onChange={handleInputChange}
                  placeholder="姓を入力"
                  required
                />
              </FormControl>

              <FormControl mb={3}>
                <FormLabel>名</FormLabel>
                <Input
                  name="name"
                  value={formState.name}
                  onChange={handleInputChange}
                  placeholder="名を入力"
                  required
                />
              </FormControl>

              <FormControl mb={3}>
                <FormLabel>支店</FormLabel>
                <Input
                  name="branch"
                  value={formState.branch}
                  onChange={handleInputChange}
                  placeholder="支店名を入力"
                  required
                />
              </FormControl>

              <FormControl mb={3}>
                <FormLabel>チーム</FormLabel>
                <Input
                  name="team"
                  value={formState.team}
                  onChange={handleInputChange}
                  placeholder="チーム名を入力"
                  required
                />
              </FormControl>

              {/* 既存のメールとパスワード入力フィールド */}
              <FormControl mb={3}>
                <FormLabel>メールアドレス</FormLabel>
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
                    onChange={handleInputChange}
                  />
                </InputGroup>
              </FormControl>

              <Text fontSize="12px" color="gray" mb={2}>
                パスワードは6文字以上で入力してください
              </Text>

              <FormControl mb={3}>
                <FormLabel>パスワード</FormLabel>
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
                    onChange={handleInputChange}
                  />
                </InputGroup>
              </FormControl>

              <FormControl mb={3}>
                <FormLabel>パスワード（確認）</FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <RiLockPasswordFill color="gray" />
                  </InputLeftElement>
                  <Input
                    type="password"
                    placeholder="パスワードを再入力"
                    name="passwordConf"
                    value={formState.passwordConf}
                    required
                    onChange={handleInputChange}
                  />
                </InputGroup>
              </FormControl>

              <Box mt={4} mb={2} textAlign="center">
                <Button
                  isLoading={loading}
                  loadingText="登録中..."
                  spinnerPlacement="start"
                  type="submit"
                  colorScheme="green"
                  width="100%"
                  mb={2}
                >
                  登録する
                </Button>
                <Button
                  colorScheme="gray"
                  onClick={() => router.back()}
                  width="100%"
                >
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

export default Register;
