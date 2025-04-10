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


const Main = () => {
  // 既存のstate変数をそのまま維持
  const [userData, setUserData] = useState<UserData []>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const cancelRef = useRef(null);
  const toast = useToast();
  const router = useRouter();
  const [currentCategory, setCurrentCategory] = useState<Category>('出勤');
  const openModal = (category: Category) => {
    setCurrentCategory(category);
    onOpen();
  };
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
      isOpen: isLogoutAlertOpen,
      onOpen: onLogoutAlertOpen,
      onClose: onLogoutAlertClose
  } = useDisclosure();


  /** Firestoreデータ取得 **/
  const fetchDb = async (email: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/records/read?email=${email}`);
      const data = await res.json();

      if (res.ok && data.success) {
        console.log("fetchStudies:", email, data);
        setUserData(data.data);
      } else {
        console.error("fetchStudiesError", email, data);
        throw new Error(data.error || "Failed to fetch studies.");
      }
    } catch (err: unknown) {
      console.error("Error in fetchStudies:", err);
      toast({
        title: "データ取得に失敗しました",
        position: "top",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  /** Firestore確認 **/
  useEffect(() => {
    if (email) {
      fetchDb(email);
      console.log("useEffectFirestore:", email, user);
    }
  }, [user]);

  // ユーザーがセッション中か判定する処理を追加
  useEffect(() => {
    const authUser = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        setEmail(user.email as string);
      } else {
        router.push("/user/login");
      }
    });

    return () => {
      authUser(); // クリーンアップ
    };
  }, []);

  /**ログアウト処理 **/
  const handleLogout = async () => {
    //async/awaitによる非同期通信
    setLoading(true); //ローディング中にセット
    try {
      const usertLogout = await auth.signOut(); //Firebase SDKのsignOutによるログアウト処理
      console.log("User Logout:", usertLogout);
      toast({
        //ChakraUIのトースト機能で、ログアウト成功メッセージを表示
        title: "ログアウトしました",
        position: "top",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      router.push("/user/login"); //ログアウト成功時は、useRouterの機能で、"/user/login"に移動
    } catch (error) {
      //エラーの場合は、
      console.error("Error during logout:", error);
      toast({
        //ChakraUIのトースト機能で、ログアウト失敗メッセージを表示
        title: "ログアウトに失敗しました",
        description: `${error}`,
        position: "top",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false); //最後にローディング状態を解除
    }
  };

  return (
      <Flex direction="column" align="center" minHeight="100vh" padding={4} background="gray.50">
      {/* 左上に支店名と班名 */}
          <Flex
              width="100%"
              bgGradient="linear(to-r, teal.500, cyan.500)"
              py={4}
              px={8}
              borderRadius="md"
              boxShadow="sm"
              justify="space-between"
              mb={4}
          >
            <Flex>
              <Box><Text fontWeight="bold" color="white">{userData[0]?.branch}</Text></Box>
              <Box><Text color="whiteAlpha.800">{userData[0]?.team}</Text></Box>
            </Flex>
            <Box>
              <Text color="white">ようこそ {userData[0]?.name || "データがありません"} さん</Text>
            </Box>
          </Flex>

      {/* 中央の見出し */}
      <Heading as="h1" size="xl" mb={6}>勤怠管理サイト</Heading>

      {/* 勤怠モーダル - 正しいuseDisclosureの値を使用 */}
      <AttendanceModal
        isOpen={isOpen}
        onClose={onClose}
        primaryCategory={currentCategory}
        userData={userData[0]}
      />

      {/* 勤怠ボタン部分の修正*/}
      <Box p={6} textAlign="center">
        <HStack spacing={4} justify="center">
          <Button
            onClick={() => openModal('出勤')}
            colorScheme="teal"
            variant="solid"
            size="lg"
            boxShadow="md"
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
          >
            出勤
          </Button>
          <Button
            onClick={() => openModal('退勤')}
            colorScheme="cyan"
            variant="solid"
            size="lg"
            boxShadow="md"
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
          >
            退勤
          </Button>
          <Button
            onClick={() => openModal('欠勤')}
            colorScheme="orange"
            variant="solid"
            size="lg"
            boxShadow="md"
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
          >
            欠勤
          </Button>
          <Button
            onClick={() => openModal('公休')}
            colorScheme="purple"
            variant="solid"
            size="lg"
            boxShadow="md"
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
          >
            公休
          </Button>
        </HStack>
      </Box>

      {/* 下部のプロフィール変更とログアウトボタン */}
      <Flex direction="row" gap={4}>
        <Button
          colorScheme="teal"
          variant="outline"
          onClick={() => router.push("/user/profile")}
        >
          プロフィール変更
        </Button>
          <Stack spacing={3}>
            <Button width="100%" variant="outline" onClick={onLogoutAlertOpen}>
              ログアウト
            </Button>
            <AlertDialog
                motionPreset="slideInBottom"
                leastDestructiveRef={cancelRef}
                onClose={onLogoutAlertClose}
                isOpen={isLogoutAlertOpen}
                isCentered
            >
              <AlertDialogOverlay />
              <AlertDialogContent>
                <AlertDialogHeader>ログアウト</AlertDialogHeader>
                <AlertDialogCloseButton />
                <AlertDialogBody>ログアウトしますか?</AlertDialogBody>
                <AlertDialogFooter>
                  <Button ref={cancelRef} onClick={onLogoutAlertClose}>
                    Cancel
                  </Button>
                  <Button
                      isLoading={loading} //追加
                      loadingText="Loading"
                      spinnerPlacement="start"
                      colorScheme="red"
                      ml={3}
                      onClick={handleLogout} //変更
                  >
                    ログアウト
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Stack>
      </Flex>
    </Flex>
  );
}
 export default Main;