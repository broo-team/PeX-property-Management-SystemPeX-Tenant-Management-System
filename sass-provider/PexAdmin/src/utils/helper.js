export const validateEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
}; 

export const validatePhoneNumber = (phoneNumber) => {
    const phoneRegex = /^(09|07)\d{8}$/;
    return phoneRegex.test(phoneNumber);
  };