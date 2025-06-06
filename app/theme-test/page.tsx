"use client";

import React from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Link } from "@heroui/link";
import { Switch } from "@heroui/switch";
import { ThemeSwitch } from "@/components/theme-switch";

export default function ThemeTestPage() {
    const [switchValue, setSwitchValue] = React.useState(false);

    return (
        <div className="flex flex-col gap-10 py-10">
            <div className="flex flex-col gap-4">
                <h1 className="text-4xl font-bold">Theme Test Page</h1>
                <p className="text-muted-foreground">
                    This page demonstrates the orange theme implementation with various HeroUI components.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-6 p-6 border rounded-lg">
                    <h2 className="text-2xl font-semibold">Button Variants</h2>
                    <div className="flex flex-wrap gap-4">
                        <Button>Default</Button>
                        <Button color="primary">Primary</Button>
                        <Button variant="flat" color="primary">Flat</Button>
                        <Button variant="bordered" color="primary">Bordered</Button>
                        <Button variant="light" color="primary">Light</Button>
                        <Button variant="ghost" color="primary">Ghost</Button>
                        <Button variant="shadow" color="primary">Shadow</Button>
                        <Button isDisabled>Disabled</Button>
                    </div>
                </div>

                <div className="flex flex-col gap-6 p-6 border rounded-lg">
                    <h2 className="text-2xl font-semibold">Input Fields</h2>
                    <div className="flex flex-col gap-4">
                        <Input label="Default Input" placeholder="Enter text here" />
                        <Input
                            color="primary"
                            label="Primary Input"
                            placeholder="Enter text here"
                        />
                        <Input
                            variant="bordered"
                            color="primary"
                            label="Bordered Input"
                            placeholder="Enter text here"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-6 p-6 border rounded-lg">
                    <h2 className="text-2xl font-semibold">Links & Text</h2>
                    <div className="flex flex-col gap-4">
                        <p className="text-foreground">Regular text in foreground color</p>
                        <p className="text-primary">Primary colored text</p>
                        <p className="text-muted-foreground">Muted text for less emphasis</p>
                        <div className="flex gap-4">
                            <Link href="#" color="foreground">Default Link</Link>
                            <Link href="#" color="primary">Primary Link</Link>
                            <Link href="#" underline="always">Underlined Link</Link>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6 p-6 border rounded-lg">
                    <h2 className="text-2xl font-semibold">Toggle Controls</h2>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <Switch
                                isSelected={switchValue}
                                onValueChange={setSwitchValue}
                            />
                            <span>Default Switch: {switchValue ? "On" : "Off"}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Switch
                                color="primary"
                                isSelected={switchValue}
                                onValueChange={setSwitchValue}
                            />
                            <span>Primary Switch: {switchValue ? "On" : "Off"}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <ThemeSwitch />
                            <span>Theme Switch</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 