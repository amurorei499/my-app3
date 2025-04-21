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
  Spinner,
  Center,
} from "@chakra-ui/react";
import { User } from "firebase/auth";
import { Timestamp } from "firebase/firestore";
import { MdLogin, MdLogout, MdSick, MdHotel } from "react-icons/md";
import AttendanceModal, { Category } from './AttendanceModal';
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/utils/firebase";

interface UserData {
  id: string;
  email: string;
  family_name: string;
  name: string;
  role: "user" | "admin" | "manager" | "viewer";
  branch?: string;
  team?: string;
  created_at: Date | Timestamp;
  updated_at: Date | Timestamp;
}

const Main = () => {
  // State variables
  const [userData, setUserData] = useState<UserData | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
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
  const fetchDb = async (user: User) => {
    try {
      if (!user.uid) {
        console.error('UIDが取得できません');
        setUserData(null);
        return;
      }

      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        setUserData({
          id: user.uid,
          email: user.email || '',
          family_name: data.family_name || '',
          name: data.name || '',
          role: data.role || 'user',
          branch: data.branch,
          team: data.team,
          created_at: data.created_at || Timestamp.now(),
          updated_at: data.updated_at || Timestamp.now()
        });
      } else {
        console.error('ユーザーデータが見つかりません');
        setUserData(null);
      }
    } catch (error) {
      console.error('ユーザーデータの取得に失敗しました:', error);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  // 認証状態の監視
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user?.email) {
        setUser(user);
        setEmail(user.email);
        fetchDb(user);
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

  // 権限チェック関数を修正
  const checkAdminPermission = (userData: UserData | null) => {
    if (!userData) return false;
    // 特定UIDのユーザーに管理者権限を付与
    const adminUID = 'RwHDYu1wkPVrRUJ13kiMMFrB9E72';
    const isAdmin = userData.role === 'admin';
    const isSpecialUser = auth.currentUser?.uid === adminUID;
    
    return isAdmin || isSpecialUser;
  };

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
        <Box>
          <Text fontSize="xl" fontWeight="bold" color="cyan.400">
            {userData ? (userData.branch || "支店未設定") : "読み込み中..."}
          </Text>
          <Text fontSize="md" color="gray.400">
            {userData ? (userData.team || "班未設定") : "読み込み中..."}
          </Text>
        </Box>

        <Box textAlign="right">
          <Text fontSize="sm" color="gray.400">{currentDate}</Text>
          <Text color="gray.400">
            {userData ? (
              `${userData.family_name} ${userData.name}さん`
            ) : (
              "読み込み中..."
            )}
          </Text>
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

          {/* 大きなデジタル時計表示 */}
          <Box textAlign="center" mb={12}>
            <Text fontSize="md" color="gray.500" mt={2}>{currentDate}</Text>
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
          </Box>

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
          <Box width="100%" maxW="500px" mx="auto" mt={12}>
            <Flex
              justify="space-between"
              align="center"
              width="100%"
            >
              <Button
                onClick={() => router.push("/user/profile")}
                variant="ghost"
                borderRadius="full"
                color="gray.300"
                _hover={{ bg: 'rgba(255,255,255,0.05)' }}
                size="md"
                flex="1"
                maxW="160px"
              >
                プロフィール設定
              </Button>
              {checkAdminPermission(userData) && (
                <Button
                  onClick={() => router.push("/admin")}
                  variant="ghost"
                  borderRadius="full"
                  color="cyan.400"
                  _hover={{ 
                    bg: 'rgba(0, 255, 255, 0.1)',
                    transform: "translateY(-2px)"
                  }}
                  _active={{
                    transform: "scale(0.98)"
                  }}
                  size="md"
                  flex="1"
                  maxW="160px"
                  mx={2}
                  transition="all 0.2s"
                >
                  管理者ページ
                </Button>
              )}
              <Button
                onClick={onLogoutAlertOpen}
                variant="outline"
                borderRadius="full"
                borderColor="red.500"
                color="red.400"
                _hover={{ bg: 'rgba(229,62,62,0.1)' }}
                size="md"
                flex="1"
                maxW="160px"
              >
                ログアウト
              </Button>
            </Flex>
          </Box>
        </Box>
      </Box>

      {/* モーダル */}
      {isOpen && userData && (
        <AttendanceModal
          isOpen={isOpen}
          onClose={onClose}
          primaryCategory={currentCategory}
          userData={userData}
        />
      )}

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
              <Button ref={cancelRef} bg="gray.700" variant="solid" onClick={onLogoutAlertClose}>
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

      {loading && (
        <Center h="100vh">
          <Spinner size="xl" color="blue.500" />
        </Center>
      )}
    </Box>
  );
};

export default Main;
