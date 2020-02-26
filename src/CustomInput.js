import React from "react";
import { render } from "react-dom";
import { TransitionMotion, spring } from "react-motion";
import "./CustomInput.css";

class CustomInput extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            active: (props.locked && props.active) || false,
            value: props.value || "",
            error: props.error || "",
            numericOnly: props.numericOnly || false,
            label: props.label || "Label"
        };
    }

    changeValue(event) {
        let value = event.target.value;
        if (this.props.numericOnly) {
            value = value.replace(/[^0-9.]/g, '');
        }
        this.setState({ value, error: "" });
        this.props.onChange(value);
    }

    handleKeyPress(event) {
        if (event.which === 13) {
            this.setState({ value: this.props.predicted });
        }
    }

    render() {
        const { active, value, error, label } = this.state;
        const { predicted, locked } = this.props;
        const fieldClassName = `field ${(locked ? active : active || value) &&
            "active"} ${locked && !active && "locked"}`;

        return (
            <div className={fieldClassName}>
                {active && value && predicted && predicted.includes(value) && (
                    <p className="predicted">{predicted}</p>
                )}
                <input
                    type="text"
                    value={value}
                    placeholder={label}
                    onChange={this.changeValue.bind(this)}
                    onKeyPress={this.handleKeyPress.bind(this)}
                    onFocus={() => !locked && this.setState({ active: true })}
                    onBlur={() => !locked && this.setState({ active: false })}
                />
                <label htmlFor={1} className={error && "error"}>
                    {error || label}
                </label>
            </div>
        );
    }
}

export default CustomInput;