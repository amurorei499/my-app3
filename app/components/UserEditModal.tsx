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
import { doc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/app/utils/firebase";
import { auth } from "@/app/utils/firebase";

interface User {
  id: string;
  email: string;
  family_name?: string;
  name: string;
  role: "admin" | "manager" | "user" | "viewer";
  branch?: string;
  team?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

type UserRole = "admin" | "manager" | "user" | "viewer";

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
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
      setFormData({
        family_name: user.family_name || '',
        name: user.name || '',
        branch: user.branch || '',
        team: user.team || '',
      });
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

  // モーダルが閉じられたときにフォームをリセット
  useEffect(() => {
    if (!isOpen) {
      setFormData({});
      setSelectedRole("user");
    }
  }, [isOpen]);

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
      // Firestoreの更新
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        role: selectedRole,
        family_name: formData.family_name,
        name: formData.name,
        branch: formData.branch,
        team: formData.team,
        updated_at: serverTimestamp()
      });

      // カスタムクレームの更新
      const response = await fetch('/admin/updateUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
        },
        body: JSON.stringify({
          userId: user.id,
          userData: {
            role: selectedRole
          }
        })
      });

      if (!response.ok) {
        throw new Error('カスタムクレームの更新に失敗しました');
      }
      
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
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      isCentered
      size={{ base: "full", md: "md" }}
      motionPreset="slideInBottom"
    >
      <ModalOverlay backdropFilter="blur(2px)" />
      <ModalContent 
        bg="white"
        mx={{ base: 2, md: "auto" }}
        my={{ base: "auto", md: "3.75rem" }}
        maxH={{ base: "100vh", md: "auto" }}
        borderRadius={{ base: "15px 15px 0 0", md: "md" }}
        position={{ base: "fixed", md: "relative" }}
        bottom={{ base: 0, md: "auto" }}
      >
        <ModalHeader
          fontSize={{ base: "xl", md: "2xl" }}
          textAlign="center"
          borderBottom="1px solid"
          borderColor="gray.100"
          py={4}
        >
          ユーザー情報の編集
        </ModalHeader>
        <ModalCloseButton 
          size="lg"
          top={{ base: 3, md: 4 }}
          right={{ base: 3, md: 4 }}
        />
        <ModalBody 
          pb={6}
          px={{ base: 4, md: 6 }}
          maxH={{ base: "calc(100vh - 200px)", md: "auto" }}
          overflowY="auto"
        >
          <VStack spacing={6} align="stretch">
            <FormControl>
              <FormLabel 
                fontSize={{ base: "md", md: "md" }}
                fontWeight="bold"
              >
                姓
              </FormLabel>
              <Input
                name="family_name"
                value={formData.family_name || ''}
                onChange={handleChange}
                placeholder="姓"
                size="lg"
                borderRadius="md"
                bg="gray.50"
                _focus={{
                  bg: "white",
                  borderColor: "blue.500"
                }}
              />
            </FormControl>
            <FormControl>
              <FormLabel
                fontSize={{ base: "md", md: "md" }}
                fontWeight="bold"
              >
                名
              </FormLabel>
              <Input
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                placeholder="名"
                size="lg"
                borderRadius="md"
                bg="gray.50"
                _focus={{
                  bg: "white",
                  borderColor: "blue.500"
                }}
              />
            </FormControl>
            <FormControl>
              <FormLabel
                fontSize={{ base: "md", md: "md" }}
                fontWeight="bold"
              >
                メールアドレス
              </FormLabel>
              <Input
                value={user?.email || ""}
                isReadOnly
                size="lg"
                borderRadius="md"
                bg="gray.100"
                cursor="not-allowed"
              />
            </FormControl>
            <FormControl>
              <FormLabel
                fontSize={{ base: "md", md: "md" }}
                fontWeight="bold"
              >
                支店
              </FormLabel>
              <Select
                name="branch"
                value={formData.branch || ''}
                onChange={handleChange}
                size="lg"
                borderRadius="md"
                bg="gray.50"
                _focus={{
                  bg: "white",
                  borderColor: "blue.500"
                }}
              >
                <option value="">支店を選択</option>
                {branches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel
                fontSize={{ base: "md", md: "md" }}
                fontWeight="bold"
              >
                班
              </FormLabel>
              <Select
                name="team"
                value={formData.team || ''}
                onChange={handleChange}
                size="lg"
                borderRadius="md"
                bg="gray.50"
                isDisabled={!formData.branch}
                _focus={{
                  bg: "white",
                  borderColor: "blue.500"
                }}
              >
                <option value="">班を選択</option>
                {availableTeams.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel
                fontSize={{ base: "md", md: "md" }}
                fontWeight="bold"
              >
                権限
              </FormLabel>
              <Select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                isDisabled={isLoading}
                size="lg"
                borderRadius="md"
                bg="gray.50"
                _focus={{
                  bg: "white",
                  borderColor: "blue.500"
                }}
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
        <ModalFooter
          borderTop="1px solid"
          borderColor="gray.100"
          px={{ base: 4, md: 6 }}
          py={4}
          gap={3}
        >
          <Button 
            variant="outline" 
            mr={3} 
            onClick={onClose} 
            isDisabled={isLoading}
            size="lg"
            w={{ base: "full", md: "auto" }}
            borderRadius="md"
          >
            キャンセル
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isLoading}
            loadingText="更新中..."
            size="lg"
            w={{ base: "full", md: "auto" }}
            borderRadius="md"
          >
            更新
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
