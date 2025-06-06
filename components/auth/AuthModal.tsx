// PRD: Auth
'use client';

import { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Button } from '@heroui/button';
import { Tabs, Tab } from '@heroui/tabs';
import { useAuthStore } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [activeTab, setActiveTab] = useState('login');
    const router = useRouter();
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);

    // Effect to close modal and redirect when authenticated
    useEffect(() => {
        if (isAuthenticated && isOpen) {
            onClose();
            router.push('/dashboard');
        }
    }, [isAuthenticated, isOpen, onClose, router]);

    const handleTabChange = (key: React.Key) => {
        setActiveTab(key as string);
    };

    const handleLoginSuccess = () => {
        // This will be handled by the useEffect above
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} backdrop="blur">
            <ModalContent className="max-w-md mx-auto">
                <ModalHeader className="flex flex-col gap-1">
                    <h2 className="text-xl font-bold">Welcome to LoopList</h2>
                    <p className="text-sm text-default-500">Track your micro-habits with social accountability</p>
                </ModalHeader>
                <ModalBody>
                    <Tabs
                        selectedKey={activeTab}
                        onSelectionChange={handleTabChange}
                        aria-label="Authentication options"
                        variant="underlined"
                        classNames={{
                            tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                            cursor: "w-full bg-primary",
                            tab: "max-w-fit px-0 h-12",
                            tabContent: "group-data-[selected=true]:text-primary"
                        }}
                    >
                        <Tab key="login" title="Login">
                            <LoginForm onSuccess={handleLoginSuccess} />
                        </Tab>
                        <Tab key="signup" title="Sign Up">
                            <SignupForm onSuccess={() => setActiveTab('login')} />
                        </Tab>
                    </Tabs>
                </ModalBody>
                <ModalFooter>
                    <Button variant="flat" onPress={onClose}>
                        Cancel
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
} 