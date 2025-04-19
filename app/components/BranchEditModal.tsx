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
  Button,
  VStack,
  useToast,
  Text,
  InputGroup,
  InputRightElement,
  IconButton,
  Flex,
  Tag,
  TagLabel,
  TagCloseButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Divider,
  Tooltip,
} from "@chakra-ui/react";
import { AddIcon, InfoIcon } from "@chakra-ui/icons";
import { doc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/utils/firebase";

interface Branch {
  id: string;
  name: string;
  teams: string[];
  latitude?: number;
  longitude?: number;
  radius?: number;
  created_at: Date;
  updated_at: Date;
}

interface BranchEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch?: Branch;
  onBranchUpdated: () => void;
}

export default function BranchEditModal({
  isOpen,
  onClose,
  branch,
  onBranchUpdated,
}: BranchEditModalProps) {
  const [branchName, setBranchName] = useState(branch?.name || "");
  const [newTeam, setNewTeam] = useState("");
  const [teams, setTeams] = useState<string[]>(branch?.teams || []);
  const [latitude, setLatitude] = useState<number | undefined>(branch?.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(branch?.longitude);
  const [radius, setRadius] = useState<number | undefined>(branch?.radius || 100);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (branch) {
      setBranchName(branch.name);
      setTeams(branch.teams);
      setLatitude(branch.latitude);
      setLongitude(branch.longitude);
      setRadius(branch.radius || 100);
    } else {
      setBranchName("");
      setTeams([]);
      setLatitude(undefined);
      setLongitude(undefined);
      setRadius(100);
    }
  }, [branch, isOpen]);

  const handleAddTeam = () => {
    if (newTeam && !teams.includes(newTeam)) {
      setTeams([...teams, newTeam]);
      setNewTeam("");
    }
  };

  const handleRemoveTeam = (teamToRemove: string) => {
    setTeams(teams.filter(team => team !== teamToRemove));
  };

  // 現在位置を取得する関数
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "位置情報が利用できません",
        description: "お使いのブラウザは位置情報をサポートしていません",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        toast({
          title: "位置情報を取得しました",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      },
      (error) => {
        toast({
          title: "位置情報の取得に失敗しました",
          description: error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    );
  };

  const handleSubmit = async () => {
    if (!branchName) {
      toast({
        title: "支店名を入力してください",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const branchData = {
        name: branchName,
        teams,
        latitude: latitude || null,
        longitude: longitude || null,
        radius: radius || null,
        updated_at: serverTimestamp(),
      };

      if (branch) {
        await updateDoc(doc(db, "branches", branch.id), branchData);
        toast({
          title: "支店情報を更新しました",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        await addDoc(collection(db, "branches"), {
          ...branchData,
          created_at: serverTimestamp(),
        });
        toast({
          title: "支店を追加しました",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }

      onBranchUpdated();
      onClose();
    } catch (error) {
      console.error("Error saving branch:", error);
      toast({
        title: "エラーが発生しました",
        description: "支店情報の保存に失敗しました",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {branch ? "支店情報の編集" : "新規支店の追加"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>支店名</FormLabel>
              <Input
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="支店名を入力"
              />
            </FormControl>

            <FormControl>
              <FormLabel>所属班</FormLabel>
              <InputGroup size="md">
                <Input
                  value={newTeam}
                  onChange={(e) => setNewTeam(e.target.value)}
                  placeholder="班名を入力"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTeam();
                    }
                  }}
                />
                <InputRightElement width="4.5rem">
                  <IconButton
                    h="1.75rem"
                    size="sm"
                    aria-label="Add team"
                    icon={<AddIcon />}
                    onClick={handleAddTeam}
                  />
                </InputRightElement>
              </InputGroup>
              <Flex wrap="wrap" gap={2} mt={2}>
                {teams.map((team) => (
                  <Tag
                    key={team}
                    size="md"
                    borderRadius="full"
                    variant="solid"
                    colorScheme="blue"
                  >
                    <TagLabel>{team}</TagLabel>
                    <TagCloseButton
                      onClick={() => handleRemoveTeam(team)}
                    />
                  </Tag>
                ))}
              </Flex>
            </FormControl>

            <Divider />

            <FormControl>
              <Flex align="center" mb={2}>
                <FormLabel mb={0}>位置情報</FormLabel>
                <Tooltip label="勤怠登録時の位置情報認証に使用されます">
                  <InfoIcon color="gray.400" />
                </Tooltip>
                <Button
                  size="sm"
                  ml="auto"
                  onClick={getCurrentLocation}
                  isLoading={isLoading}
                >
                  現在位置を取得
                </Button>
              </Flex>
              <VStack spacing={3}>
                <InputGroup size="md">
                  <FormLabel w="80px" fontSize="sm" pt={2}>緯度:</FormLabel>
                  <NumberInput
                    value={latitude}
                    onChange={(_, value) => setLatitude(value)}
                    precision={6}
                    step={0.000001}
                  >
                    <NumberInputField placeholder="緯度を入力" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </InputGroup>

                <InputGroup size="md">
                  <FormLabel w="80px" fontSize="sm" pt={2}>経度:</FormLabel>
                  <NumberInput
                    value={longitude}
                    onChange={(_, value) => setLongitude(value)}
                    precision={6}
                    step={0.000001}
                  >
                    <NumberInputField placeholder="経度を入力" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </InputGroup>

                <InputGroup size="md">
                  <FormLabel w="80px" fontSize="sm" pt={2}>範囲(m):</FormLabel>
                  <NumberInput
                    value={radius}
                    onChange={(_, value) => setRadius(value)}
                    min={1}
                    max={1000}
                    step={10}
                  >
                    <NumberInputField placeholder="許容範囲を入力" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </InputGroup>
              </VStack>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            キャンセル
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            {branch ? "更新" : "追加"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 