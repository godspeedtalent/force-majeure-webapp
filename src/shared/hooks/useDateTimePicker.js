import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
export function useDateTimePicker({ value, onChange }) {
    const [time, setTime] = useState('21:00');
    const [tempDate, setTempDate] = useState(value);
    const [tempTime, setTempTime] = useState('21:00');
    const [isOpen, setIsOpen] = useState(false);
    const lastClickRef = useRef(0);
    useEffect(() => {
        if (value) {
            setTime(format(value, 'HH:mm'));
            setTempDate(value);
            setTempTime(format(value, 'HH:mm'));
        }
    }, [value]);
    const handleDateSelect = (date) => {
        setTempDate(date);
    };
    const handleDateDoubleClick = (date) => {
        if (date) {
            const [hours, minutes] = tempTime.split(':').map(Number);
            const newDate = new Date(date);
            newDate.setHours(hours, minutes);
            onChange(newDate);
            setTime(tempTime);
            setIsOpen(false);
        }
    };
    const handleDayClick = (date) => {
        const now = Date.now();
        if (now - lastClickRef.current < 300) {
            handleDateDoubleClick(date);
        }
        lastClickRef.current = now;
    };
    const handleTimeChange = (newTime) => {
        setTempTime(newTime);
    };
    const handleConfirm = () => {
        if (tempDate) {
            const [hours, minutes] = tempTime.split(':').map(Number);
            const newDate = new Date(tempDate);
            newDate.setHours(hours, minutes);
            onChange(newDate);
            setTime(tempTime);
        }
        setIsOpen(false);
    };
    const handleCancel = () => {
        setTempDate(value);
        setTempTime(time);
        setIsOpen(false);
    };
    return {
        time,
        tempDate,
        tempTime,
        isOpen,
        setIsOpen,
        handleDateSelect,
        handleDayClick,
        handleTimeChange,
        handleConfirm,
        handleCancel,
    };
}
