// /app/components/MainPage.tsx
"use client";

import { useEffect, useState } from "react";
import { Box, Button, Container, Heading, Text } from "@chakra-ui/react";
import { getAuth } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function MainPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const auth = getAuth();

  useEffect(() => {
    const fetchUserClaims = async () => {
      setLoading(true);
      try {
        const user = auth.currentUser;
        if (!user) {
          setIsAdmin(false);
          return;
        }

        // IDトークンからカスタムクレームを取得
        const idTokenResult = await user.getIdTokenResult();
        setIsAdmin(!!idTokenResult.claims.admin); // `admin`クレームが存在するか確認
      } catch (error) {
        console.error("カスタムクレーム取得エラー:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    fetchUserClaims();
  }, [auth]);

  return (
    <Container maxW="container.md" py={6}>
      <Heading as="h1" size="xl" mb={6}>
        メインページ
      </Heading>

      <Box mb={4}>
        <Text fontSize="lg">勤怠管理システムへようこそ。</Text>
      </Box>

      {loading ? (
        <Text>権限を確認しています...</Text>
      ) : isAdmin ? (
        <Button colorScheme="blue" onClick={() => router.push("/viewdata")}>
          データ確認ページへ
        </Button>
      ) : (
        <Text color="red.500">このボタンは管理者のみ利用可能です。</Text>
      )}
    </Container>
  );
}
