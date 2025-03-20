import { useFrappeAuth } from "frappe-react-sdk";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const Login = () => {
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loginError, setLoginError] = useState<any>('');
    const { login, isLoading } = useFrappeAuth();
    const navigate = useNavigate(); // Hook for navigation

    const onSubmit = () => {
        login({
            username: username,
            password: password,
        })
            .then((res) => {
                console.log(res);
                setLoginError(undefined);
                navigate('/dashboard'); // Redirect to the dashboard on success
            })
            .catch((err) => {
                setLoginError(err);
            });
    };

    return (
        <div className="flex justify-center items-center w-screen h-screen">
            <Card className="w-[480px]">
                <CardHeader>
                    <CardTitle>Login</CardTitle>
                    <CardDescription>Access your account SPP ERP</CardDescription>
                </CardHeader>
                <CardContent>
                    {loginError ? <div className="text-red-500">{loginError.message}</div> : null}
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-4">
                            <Label htmlFor="username">Username/Email</Label>
                            <Input
                                id="username"
                                placeholder="Username"
                                onChange={(e) => setUsername(e.target.value)}
                                value={username}
                            />
                        </div>
                        <div className="flex flex-col gap-4">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="*******"
                                onChange={(e) => setPassword(e.target.value)}
                                value={password}
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={onSubmit} disabled={isLoading}>
                        {isLoading ? 'Logging in...' : 'Login'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Login;
