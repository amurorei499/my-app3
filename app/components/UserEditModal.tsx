// /app/components/UserEditModal.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  VStack,
  Text,
  Divider,
  useToast,
} from "@chakra-ui/react";
import { UserData } from "@/app/utils/userData";
import { BranchName, branches, getTeamsByBranch } from "@/app/utils/branchData";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/utils/firebase";

type UserRole = "admin" | "manager" | "user" | "viewer";

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData | null;
  onUserUpdated: () => void;
}

export default function UserEditModal({
  isOpen,
  onClose,
  user,
  onUserUpdated,
}: UserEditModalProps) {
  const [formData, setFormData] = useState<Partial<UserData>>({});
  const [availableTeams, setAvailableTeams] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<UserRole>(user?.role || "user");
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // ユーザーデータをフォームにセット
  useEffect(() => {
    if (user) {
      setSelectedRole(user.role || "user");
      if (user.branch) {
        setAvailableTeams(getTeamsByBranch(user.branch as BranchName));
      }
    }
  }, [user]);

  // 支店が変更されたら、利用可能な班のリストを更新
  useEffect(() => {
    if (formData.branch) {
      const validBranch = formData.branch as BranchName;
      setAvailableTeams(getTeamsByBranch(validBranch));

      if (formData.team && !getTeamsByBranch(validBranch).includes(formData.team)) {
        setFormData(prev => ({ ...prev, team: "" }));
      }
    } else {
      setAvailableTeams([]);
    }
  }, [formData.branch]);

  // フォームの変更を処理
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 権限の変更を処理
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRole(e.target.value as UserRole);
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        role: selectedRole,
        family_name: formData.family_name,
        name: formData.name,
        updated_at: serverTimestamp()
      });
      
      toast({
        title: "ユーザー情報を更新しました",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      onUserUpdated();
      onClose();
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "更新に失敗しました",
        description: error instanceof Error ? error.message : "不明なエラーが発生しました",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  const roleOptions = [
    { value: "admin", label: "管理者" },
    { value: "manager", label: "マネージャー" },
    { value: "user", label: "一般ユーザー" },
    { value: "viewer", label: "閲覧者" }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent bg="white">
        <ModalHeader>ユーザー情報の編集</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>姓</FormLabel>
              <Input
                name="family_name"
                value={formData.family_name || ''}
                onChange={handleChange}
                placeholder="姓"
              />
            </FormControl>
            <FormControl>
              <FormLabel>名</FormLabel>
              <Input
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                placeholder="名"
              />
            </FormControl>
            <FormControl>
              <FormLabel>メールアドレス</FormLabel>
              <Input value={user?.email || ""} isReadOnly />
            </FormControl>
            <FormControl>
              <FormLabel>権限</FormLabel>
              <Select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                isDisabled={isLoading}
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isLoading}>
            キャンセル
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isLoading}
            loadingText="更新中..."
          >
            更新
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
