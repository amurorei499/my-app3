// AttendanceModal.tsx
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
  Text
} from '@chakra-ui/react';
import DataSend from './DataSend';
import { UserData } from "../utils/userData";

// リテラル型の定義
export type Category = '出勤' | '退勤' | '欠勤' | '公休';

// 各主要カテゴリに対応する詳細カテゴリのマッピング
const categoryOptions: Record<Category, string[]> = {
  '出勤': ['通常出勤', '早出出勤', '遅出出勤', '休日出勤'],
  '退勤': ['通常退勤', '早退'],
  '欠勤': [],
  '公休': []
};

// モーダルの型定義
type AttendanceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  primaryCategory: Category; // 型をリテラル型に変更
  userData: UserData;  // any型からUserData型に変更
};

const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  primaryCategory,
  userData
}) => {
  // 詳細カテゴリの状態管理（初期値は空にして、useEffectで設定）
  const [secondaryCategory, setSecondaryCategory] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  // primaryCategoryが変わったときに詳細カテゴリを初期化
  useEffect(() => {
    if (primaryCategory === '出勤') {
      setSecondaryCategory('通常出勤');
    } else if (primaryCategory === '退勤') {
      setSecondaryCategory('通常退勤');
    } else {
      setSecondaryCategory('');
    }
    // 理由もリセット
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
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(5px)" />
      <ModalContent
        borderRadius="xl"
        boxShadow="xl"
        bg="white"
      >
        <ModalHeader
          borderBottomWidth="1px"
          color={
            primaryCategory === '出勤' ? 'teal.500' :
            primaryCategory === '退勤' ? 'cyan.500' :
            primaryCategory === '欠勤' ? 'orange.500' : 'purple.500'
          }
        >
          {primaryCategory}登録
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody py={6}>
          <VStack spacing={5} align="start">
            <Text>• {userData?.name || "データがありません"}さん</Text>
            <Text>• {userData?.branch || "データがありません"}</Text>
            <Text>• {userData?.team || "データがありません"}</Text>

            {/* 詳細カテゴリ選択（出勤・退勤の場合） */}
            {categoryOptions[primaryCategory]?.length > 0 && (
              <FormControl>
                <FormLabel fontWeight="medium">{primaryCategory}の種類</FormLabel>
                <RadioGroup
                  value={secondaryCategory}
                  onChange={setSecondaryCategory}
                  colorScheme={
                    primaryCategory === '出勤' ? 'teal' :
                    primaryCategory === '退勤' ? 'cyan' :
                    'orange'
                  }
                >
                  <VStack align="start" spacing={2}>
                    {categoryOptions[primaryCategory].map((option: string) => (
                      <Radio key={option} value={option}>
                        {option}
                      </Radio>
                    ))}
                  </VStack>
                </RadioGroup>
              </FormControl>
            )}

            {/* 理由入力フィールド（欠勤・公休の場合） */}
            {needsReason && (
              <FormControl>
                <FormLabel fontWeight="medium">理由</FormLabel>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={`${primaryCategory}の理由を入力してください`}
                  size="md"
                  resize="vertical"
                />
              </FormControl>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter justifyContent="center">
          {userData && (
            <DataSend
              userData={userData}
              status={primaryCategory}
              secondaryStatus={secondaryCategory}
              reason={reason}
              onSuccess={handleSuccess}
            />
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AttendanceModal;
