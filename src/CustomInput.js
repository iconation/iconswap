import React, { useState } from 'react'
import "./CustomInput.css";

const CustomInput = ({ error, label, locked, active, numericOnly, onChange }) => {

    const [_error, setError] = useState(error);
    const [_active, setActive] = useState(active);
    const [value, setValue] = useState("");
    const [predicted, setPredicted] = useState(null);

    error !== _error && setError(error)
    active !== _active && setActive(active)

    const changeValue = (event) => {
        let value = event.target.value;
        if (numericOnly) {
            value = value.replace(/[^0-9.]/g, '');
        }
        setValue(value)
        onChange(value)
        setActive(value.length > 0)
        if (value.length > 0) {
        }
    }

    const handleKeyPress = (event) => {
        if (event.which === 13) {
            setPredicted(predicted)
        }
    }

    const fieldClassName = `field ${(locked ? _active : _active || value) &&
        "active"} ${locked && !_active && "locked"} ${_error && "error"}`;

    return (
        <div className={fieldClassName}>
            {_active && value && predicted && predicted.includes(value) && (
                <p className="predicted">{predicted}</p>
            )}
            <input
                type="text"
                value={value}
                placeholder={label}
                onChange={changeValue}
                onKeyPress={handleKeyPress}
            />
            <label htmlFor={1}>
                {label}
            </label>
        </div>
    );
}

export default CustomInput;