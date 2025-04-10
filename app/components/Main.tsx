// /app/components/Main.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/app/utils/firebase";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Stack,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { User } from "firebase/auth";
import { UserData } from "../utils/userData";
import AttendanceModal, { Category } from './AttendanceModal';
import { Spinner } from "@chakra-ui/react";

const Main = () => {
  // State variables
  const [userData, setUserData] = useState<UserData[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [currentCategory, setCurrentCategory] = useState<Category>('出勤');
  const cancelRef = useRef(null);
  const toast = useToast();
  const router = useRouter();

  // Modal controls
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isLogoutAlertOpen,
    onOpen: onLogoutAlertOpen,
    onClose: onLogoutAlertClose
  } = useDisclosure();

  // リアルタイム時計表示用の状態
  const [currentTime, setCurrentTime] = useState("");

  // 時計更新用エフェクト
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('ja-JP'));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /** Firestoreデータ取得 **/
  const fetchDb = async (email: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/records/read?email=${email}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setUserData(data.data);
      } else {
        throw new Error(data.error || "Failed to fetch user data");
      }
    } catch (err: unknown) {
      console.error("Error in fetchStudies:", err);
      toast({
        title: "データ取得に失敗しました",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // 認証状態の監視
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        setEmail(user.email || "");
        fetchDb(user.email || "");
      } else {
        router.push("/user/login");
      }
    });

    return () => unsubscribe();
  }, []);

  /** ログアウト処理 **/
  const handleLogout = async () => {
    setLoading(true);
    try {
      await auth.signOut();
      toast({
        title: "ログアウトしました",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      router.push("/user/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "ログアウトに失敗しました",
        description: `${error}`,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Flex
      direction="column"
      minH="100vh"
      p={4}
      bgGradient="linear(to-br, gray.100, blue.50)"
    >
      {/* ヘッダーセクション */}
      <Flex
        bg="white"
        p={4}
        borderRadius="lg"
        boxShadow="md"
        justify="space-between"
        align="center"
        mb={8}
      >
        <Box>
          <Text fontSize="xl" fontWeight="bold" color="blue.600">
            {userData[0]?.branch || "未設定"}
          </Text>
          <Text color="gray.600">{userData[0]?.team || "未設定"}</Text>
        </Box>

        <Box textAlign="right">
          <Text fontSize="2xl" fontWeight="bold" color="gray.700">
            {currentTime}
          </Text>
          <Text color="gray.600">{userData[0]?.name || "ゲスト"} さん</Text>
        </Box>
      </Flex>

      {/* メインコンテンツ */}
      <Flex direction="column" align="center" flex={1}>
        <Heading
          as="h1"
          size="xl"
          mb={8}
          bgGradient="linear(to-r, blue.600, purple.600)"
          bgClip="text"
        >
          勤怠管理システム
        </Heading>

        {/* アクションボタングリッド */}
        <HStack
          spacing={6}
          mb={12}
          flexWrap="wrap"
          justify="center"
        >
          {['出勤', '退勤', '欠勤', '公休'].map((category) => (
            <Button
              key={category}
              onClick={() => {
                setCurrentCategory(category as Category);
                onOpen();
              }}
              colorScheme={
                category === '出勤' ? 'blue' :
                category === '退勤' ? 'green' :
                category === '欠勤' ? 'red' : 'purple'
              }
              size="lg"
              minW="120px"
              height="120px"
              borderRadius="xl"
              boxShadow="lg"
              _hover={{ transform: "scale(1.05)" }}
              transition="all 0.2s"
            >
              <Text fontSize="2xl">{category}</Text>
            </Button>
          ))}
        </HStack>

        {/* プロフィール管理 */}
        <Flex gap={4} mt="auto">
          <Button
            colorScheme="blue"
            variant="outline"
            onClick={() => router.push("/user/profile")}
            _hover={{ bg: 'blue.50' }}
          >
            プロフィール設定
          </Button>
          <Button
            colorScheme="red"
            variant="outline"
            onClick={onLogoutAlertOpen}
            _hover={{ bg: 'red.50' }}
          >
            ログアウト
          </Button>
        </Flex>
      </Flex>

      {/* モーダル */}
      <AttendanceModal
        isOpen={isOpen}
        onClose={onClose}
        primaryCategory={currentCategory}
        userData={userData[0]}
      />

      {/* ログアウト確認ダイアログ */}
      <AlertDialog
        leastDestructiveRef={cancelRef}
        isOpen={isLogoutAlertOpen}
        onClose={onLogoutAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              ログアウト確認
            </AlertDialogHeader>
            <AlertDialogCloseButton />
            <AlertDialogBody>
              本当にログアウトしますか？
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onLogoutAlertClose}>
                キャンセル
              </Button>
              <Button
                colorScheme="red"
                onClick={handleLogout}
                ml={3}
                isLoading={loading}
              >
                ログアウト
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Flex>
  );
}

export default Main;
