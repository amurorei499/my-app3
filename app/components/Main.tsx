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
  Grid,
  Text,
  useDisclosure,
  useToast,
  Icon,
} from "@chakra-ui/react";
import { User } from "firebase/auth";
import { UserData } from "../utils/userData";
import AttendanceModal, { Category } from './AttendanceModal';
import { Spinner } from "@chakra-ui/react";
import { MdLogin, MdLogout, MdSick, MdHotel } from "react-icons/md";

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
  const [currentDate, setCurrentDate] = useState("");

  // 時計更新用エフェクト
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('ja-JP'));
      setCurrentDate(
        now.toLocaleDateString('ja-JP', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
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
      <Flex minH="100vh" align="center" justify="center" bg="#121212">
        <Spinner size="xl" color="cyan.400"/>
      </Flex>
    );
  }

  return (
    <Box
      minH="100vh"
      bg="#121212" // ほぼ黒に近い暗いグレー
      color="white"
    >
      {/* ヘッダーセクション - 洗練された暗いデザイン */}
      <Flex
        bg="#1A1A1A"
        borderBottom="1px solid"
        borderColor="rgba(255,255,255,0.1)"
        py={4}
        px={6}
        justify="space-between"
        align="center"
        position="relative"
        zIndex={1}
      >
        <Flex align="center">
          <Box
            w="40px"
            h="40px"
            borderRadius="full"
            bg="cyan.500"
            display="flex"
            alignItems="center"
            justifyContent="center"
            mr={3}
          >
            <Text fontWeight="bold" fontSize="lg">A</Text>
          </Box>
          <Box>
            <Text fontSize="sm" color="gray.400">
              {userData[0]?.branch || "未設定"}
            </Text>
            <Text fontSize="md" fontWeight="bold">
              {userData[0]?.name || "ゲスト"} さん
            </Text>
          </Box>
        </Flex>

        <Box textAlign="right">
          <Text fontSize="sm" color="gray.400">{currentDate}</Text>
          <Text fontSize="xl" fontWeight="bold" color="cyan.400">{currentTime}</Text>
        </Box>
      </Flex>

      {/* メインコンテンツ */}
      <Box
        maxW="900px"
        mx="auto"
        pt={10}
        pb={10}
        px={4}
        position="relative"
      >
        {/* グローエフェクト */}
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          w="300px"
          h="300px"
          bg="cyan.600"
          filter="blur(120px)"
          opacity={0.15}
          zIndex={0}
          borderRadius="full"
        />

        <Box position="relative" zIndex={1}>
          {/* 大きなデジタル時計表示 */}
          <Box textAlign="center" mb={12}>
            <Text
              fontSize="6xl"
              fontWeight="900"
              letterSpacing="wider"
              bgGradient="linear(to-r, cyan.300, blue.500)"
              bgClip="text"
              lineHeight="1"
            >
              {currentTime.split(':').slice(0, 2).join(':')}
              <Text as="span" fontSize="3xl" color="gray.500" verticalAlign="top" ml={1}>
                {currentTime.split(':')[2] ? currentTime.split(':')[2].slice(0, 2) : "00"}
              </Text>
            </Text>
            <Text fontSize="md" color="gray.500" mt={2}>{currentDate}</Text>
          </Box>

          {/* タイトル */}
          <Heading
            as="h1"
            textAlign="center"
            fontSize="2xl"
            mb={10}
            letterSpacing="wider"
          >
            勤怠管理システム
          </Heading>

          {/* カラフルでモダンなボタングリッド */}
          <Grid
            templateColumns={{base: "1fr", md: "repeat(2, 1fr)"}}
            gap={6}
            mb={10}
          >
            {[
              { name: '出勤', icon: MdLogin, color: 'blue.400' },
              { name: '退勤', icon: MdLogout, color: 'green.400' },
              { name: '欠勤', icon: MdSick, color: 'red.400' },
              { name: '公休', icon: MdHotel, color: 'purple.400' }
            ].map((item) => (
              <Button
                key={item.name}
                onClick={() => {
                  setCurrentCategory(item.name as Category);
                  onOpen();
                }}
                height="100px"
                bg="#1A1A1A"
                color="white"
                borderRadius="xl"
                border="1px solid"
                borderColor="#333"
                _hover={{
                  borderColor: item.color,
                  boxShadow: `0 0 20px -5px ${item.color}`,
                  transform: "translateY(-2px)"
                }}
                _active={{
                  transform: "scale(0.98)",
                }}
                transition="all 0.3s ease"
                position="relative"
                overflow="hidden"
              >
                <Box position="absolute" top={0} left={0} h="5px" w="full" bg={item.color} />
                <Flex direction="column" align="center">
                  <Icon as={item.icon} fontSize="2xl" mb={2} color={item.color} />
                  <Text fontSize="xl">{item.name}</Text>
                </Flex>
              </Button>
            ))}
          </Grid>

          {/* プロフィール管理ボタン */}
          <Flex justify="center" gap={5} mt={12}>
            <Button
              onClick={() => router.push("/user/profile")}
              variant="ghost"
              borderRadius="full"
              color="gray.300"
              _hover={{ bg: 'rgba(255,255,255,0.05)' }}
              size="md"
            >
              プロフィール設定
            </Button>
            <Button
              onClick={onLogoutAlertOpen}
              variant="outline"
              borderRadius="full"
              borderColor="red.500"
              color="red.400"
              _hover={{ bg: 'rgba(229,62,62,0.1)' }}
              size="md"
            >
              ログアウト
            </Button>
          </Flex>
        </Box>
      </Box>

      {/* モーダル */}
      <AttendanceModal
        isOpen={isOpen}
        onClose={onClose}
        primaryCategory={currentCategory}
        userData={userData[0]}
      />

      {/* ログアウトダイアログ */}
      <AlertDialog
        leastDestructiveRef={cancelRef}
        isOpen={isLogoutAlertOpen}
        onClose={onLogoutAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg="#1A1A1A" color="white" borderRadius="xl">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              ログアウト確認
            </AlertDialogHeader>
            <AlertDialogCloseButton />
            <AlertDialogBody>
              本当にログアウトしますか？
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} variant="ghost" onClick={onLogoutAlertClose}>
                キャンセル
              </Button>
              <Button
                bg="red.500"
                _hover={{ bg: 'red.600' }}
                ml={3}
                onClick={handleLogout}
                isLoading={loading}
              >
                ログアウト
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default Main;
