import { useState, useEffect } from 'react';

const useLogin = () => {
    const [errorUsername, setErrorUsername] = useState('');
    const [errorPassword, setErrorPassword] = useState('');
    const [inputData, setInputData] = useState({ username: '', password: '' });

    useEffect(() => {
        if (inputData.username) setErrorUsername('');
        if (inputData.password) setErrorPassword('');
    }, [inputData.username, inputData.password]);

    const errorData = (dataMessage) => {
        if (dataMessage.dataInfo === 'username') {
            setErrorUsername(dataMessage.message);
        } else if (dataMessage.dataInfo === 'password') {
            setErrorPassword(dataMessage.message);
        }
    };

    const handleInputChange = (field, value) => {
        setInputData(prevState => ({
            ...prevState,
            [field]: value
        }));
    };

    return {
        errorUsername,
        errorPassword,
        inputData,
        errorData,
        handleInputChange,
    };
};

export default useLogin;