"use client";

import {
  Card,
  CardBody,
  Icon,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { IconType } from "react-icons";

interface AdminCardProps {
  title: string;
  description: string;
  icon: IconType;
  href: string;
}

export const AdminCard = ({ title, description, icon, href }: AdminCardProps) => {
  const router = useRouter();
  
  return (
    <Card
      onClick={() => router.push(href)}
      cursor="pointer"
      _hover={{
        transform: "translateY(-5px)",
        boxShadow: "xl",
      }}
      transition="all 0.2s"
      bg={useColorModeValue("white", "gray.700")}
    >
      <CardBody>
        <VStack spacing={4} align="center">
          <Icon as={icon} w={10} h={10} color="cyan.500" />
          <Text fontWeight="bold" fontSize="xl">
            {title}
          </Text>
          <Text color={useColorModeValue("gray.600", "gray.300")} textAlign="center">
            {description}
          </Text>
        </VStack>
      </CardBody>
    </Card>
  );
}; 