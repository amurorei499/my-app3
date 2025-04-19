import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  VStack,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Textarea,
  Text,
  Box,
  Flex,
  Badge,
  Button,
  Select,
  Input,
  useToast
} from '@chakra-ui/react';
import DataSend from './DataSend';
import { UserData } from "../utils/userData";
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';

// リテラル型の定義
export type Category = '出勤' | '退勤' | '欠勤' | '公休';

// 各主要カテゴリに対応する詳細カテゴリのマッピング
const categoryOptions: Record<Category, string[]> = {
  '出勤': ['通常出勤', '早出出勤', '遅出出勤', '休日出勤'],
  '退勤': ['通常退勤', '早退'],
  '欠勤': [],
  '公休': []
};

// カテゴリごとのカラースキーム定義
const categoryColors = {
  '出勤': {
    main: 'blue.400',
    bg: 'blue.900',
    scheme: 'blue'
  },
  '退勤': {
    main: 'green.400',
    bg: 'green.900',
    scheme: 'green'
  },
  '欠勤': {
    main: 'red.400',
    bg: 'red.900',
    scheme: 'red'
  },
  '公休': {
    main: 'purple.400',
    bg: 'purple.900',
    scheme: 'purple'
  }
};

// モーダルの型定義
interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  primaryCategory: Category;
  userData: UserData;
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  primaryCategory,
  userData
}) => {
  // 詳細カテゴリの状態管理
  const [secondaryCategory, setSecondaryCategory] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const toast = useToast();

  // 現在の色スキーム
  const currentColor = categoryColors[primaryCategory];

  // primaryCategoryが変わったときに詳細カテゴリを初期化
  useEffect(() => {
    if (primaryCategory === '出勤') {
      setSecondaryCategory('通常出勤');
    } else if (primaryCategory === '退勤') {
      setSecondaryCategory('通常退勤');
    } else {
      setSecondaryCategory('');
    }
    setReason('');
  }, [primaryCategory]);

  // 必要な理由入力フィールドを表示するかどうか
  const needsReason = primaryCategory === '欠勤' || primaryCategory === '公休';

  // 送信処理成功時の処理
  const handleSuccess = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(5px)" />
      <ModalContent
        borderRadius="xl"
        boxShadow="xl"
        bg="#1A1A1A" // ダークテーマ背景
        color="white"  // テキストを白色に
        overflow="hidden"
      >
        <Box bg={currentColor.main} py={1} />
        <ModalHeader
          borderBottomWidth="1px"
          borderColor="whiteAlpha.200"
          color={currentColor.main}
          pb={4}
          display="flex"
          alignItems="center"
        >
          <Badge
            colorScheme={currentColor.scheme}
            fontSize="md"
            p={1}
            borderRadius="md"
            mr={2}
          >
            {primaryCategory}
          </Badge>
        </ModalHeader>
        <ModalCloseButton color="gray.400" />
        <ModalBody py={6}>
          <VStack spacing={5} align="start">
            <Box
              p={4}
              opacity={0.8}
              borderRadius="md"
              width="100%"
            >
              <Flex direction="column" gap={2}>
                <Text fontSize="sm" fontWeight="bold" color="gray.300">ユーザー情報</Text>
                <Text color="white">• {userData?.name || "データがありません"}さん</Text>
                <Text color="white">• {userData?.branch || "データがありません"}</Text>
                <Text color="white">• {userData?.team || "データがありません"}</Text>
              </Flex>
            </Box>

            {/* 詳細カテゴリ選択（出勤・退勤の場合） */}
            {categoryOptions[primaryCategory]?.length > 0 && (
              <FormControl>
                <FormLabel fontWeight="medium" color="gray.300">{primaryCategory}の種類</FormLabel>
                <RadioGroup
                  value={secondaryCategory}
                  onChange={setSecondaryCategory}
                  colorScheme={currentColor.scheme}
                >
                  <VStack align="start" spacing={2}>
                    {categoryOptions[primaryCategory].map((option: string) => (
                      <Radio key={option} value={option} colorScheme={currentColor.scheme}>
                        <Text color="white">{option}</Text>
                      </Radio>
                    ))}
                  </VStack>
                </RadioGroup>
              </FormControl>
            )}

            {/* 理由入力フィールド（欠勤・公休の場合） */}
            {needsReason && (
              <FormControl>
                <FormLabel fontWeight="medium" color="gray.300">理由</FormLabel>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={`${primaryCategory}の理由を入力してください`}
                  size="md"
                  resize="vertical"
                  bg="#2D2D2D"
                  border="none"
                  color="white"
                  _hover={{ bg: "#333333" }}
                  _focus={{ bg: "#333333", borderColor: currentColor.main }}
                />
              </FormControl>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter justifyContent="center" borderTopWidth="1px" borderColor="whiteAlpha.200">
          {userData && (
            <Box width="100%">
              <DataSend
                userData={userData}
                status={primaryCategory}
                secondaryStatus={secondaryCategory}
                reason={reason}
                onSuccess={handleSuccess}
                colorScheme={currentColor.scheme}
              />
            </Box>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AttendanceModal;