import React, {useState} from 'react';

const styles = {
    paras: {
        default: {
            fontSize: "medium",
            marginTop: "0.5ex",
            marginBottom: "0.5ex"
        },
        "usfm:b": {
            height: "1em"
        },
        "usfm:d": {
            fontStyle: "italic"
        },
        "usfm:f": {
            fontSize: "small"
        },
        "usfm:hangingGraft": {},
        "usfm:imt": {
            fontWeight: "bold",
            fontStyle: "italic",
            fontSize: "xx-large",
            textAlign: "center"
        },
        "usfm:imt2": {
            fontWeight: "bold",
            fontStyle: "italic",
            fontSize: "x-large",
            textAlign: "center"
        },
        "usfm:imt3": {
            fontWeight: "bold",
            fontStyle: "italic",
            fontSize: "large",
            textAlign: "center"
        },
        "usfm:ip": {
            textIndent: "1.5em"
        },
        "usfm:io": {
            paddingLeft: "1.5em"
        },
        "usfm:iot": {
            fontWeight: "bold",
            fontSize: "large",
        },
        "usfm:is": {
            fontStyle: "italic",
            fontSize: "xx-large"
        },
        "usfm:is2": {
            fontStyle: "italic",
            fontSize: "x-large"
        },
        "usfm:is3": {
            fontStyle: "italic",
            fontSize: "large"
        },
        "usfm:li": {
            listStyleType: "disc",
            paddingLeft: "3em",
            textIndent: "-1.5em"
        },
        "usfm:li2": {
            listStyleType: "disc",
            paddingLeft: "4.5em",
            textIndent: "-1.5em"
        },
        "usfm:li3": {
            listStyleType: "disc",
            paddingLeft: "6em",
            textIndent: "-1.5em"
        },
        "usfm:m": {},
        "usfm:mi": {
            paddingLeft: "1.5em"
        },
        "usfm:mr": {
            fontSize: "large",
            fontStyle: "italic",
        },
        "usfm:ms": {
            fontWeight: "bold",
        },
        "usfm:mt": {
            fontWeight: "bold",
            fontStyle: "italic",
            fontSize: "xx-large",
            textAlign: "center"
        },
        "usfm:mt2": {
            fontWeight: "bold",
            fontStyle: "italic",
            fontSize: "x-large",
            textAlign: "center"
        },
        "usfm:mt3": {
            fontWeight: "bold",
            fontStyle: "italic",
            fontSize: "large",
            textAlign: "center"
        },
        "usfm:nb": {},
        "usfm:p": {
            textIndent: "1.5em"
        },
        "usfm:pc": {
            textAlign: "center"
        },
        "usfm:pi": {
            paddingLeft: "1.5em",
            textIndent: "1.5em"
        },
        "usfm:pi2": {
            paddingLeft: "3em",
            textIndent: "1.5em"
        },
        "usfm:pi3": {
            paddingLeft: "4.5em",
            textIndent: "1.5em"
        },
        "usfm:q": {
            paddingLeft: "1.5em",
            marginTop: "0.5ex",
            marginBottom: "0.5ex"
        },
        "usfm:q2": {
            paddingLeft: "3em",
            marginTop: "0.5ex",
            marginBottom: "0.5ex"
        },
        "usfm:q3": {
            paddingLeft: "4.5em",
            marginTop: "0.5ex",
            marginBottom: "0.5ex"
        },
        "usfm:q4": {
            paddingLeft: "6em",
            marginTop: "0.5ex",
            marginBottom: "0.5ex"
        },
        "usfm:qa": {
            fontWeight: "bold",
            fontSize: "x-large"
        },
        "usfm:qr": {
            textAlign: "right"
        },
        "usfm:r": {
            fontWeight: "bold",
        },
        "usfm:s": {
            fontStyle: "italic",
            fontSize: "xx-large"
        },
        "usfm:s2": {
            fontStyle: "italic",
            fontSize: "x-large"
        },
        "usfm:s3": {
            fontStyle: "italic",
            fontSize: "large"
        },
        "usfm:tr": {},
        "usfm:x": {
            fontSize: "small"
        }
    },
    marks: {
        default: {},
        chapter_label: {
            float: "left",
            fontSize: "xx-large",
            marginRight: "0.5em"
        },
        verses_label: {
            fontWeight: "bold",
            fontSize: "small",
            verticalAlign: "super",
            marginRight: "0.5em"
        }
    },
    wrappers: {
        default: {},
        "usfm:add": {
            fontStyle: "italic"
        },
        "usfm:bd": {
            fontWeight: "bold"
        },
        "usfm:bdit": {
            fontWeight: "bold",
            fontStyle: "italic"
        },
        "usfm:bk": {
            fontWeight: "bold"
        },
        chapter: {},
        "usfm:fl": {},
        "usfm:fm": {},
        "usfm:fqa": {
            fontStyle: "italic"
        },
        "usfm:fr": {
            fontWeight: "bold"
        },
        "usfm:ft": {},
        "usfm:it": {
            fontStyle: "italic"
        },
        "usfm:nd": {
            fontWeight: "bold",
            fontSize: "smaller"
        },
        "usfm:qs": {
            float: "right",
            fontStyle: "italic"
        },
        "usfm:tl": {
            fontStyle: "italic"
        },
        verses: {},
        "usfm:wj": {
            color: "#D00"
        },
        "usfm:xk": {},
        "usfm:xo": {
            fontWeight: "bold"
        },
        "usfm:xt": {}
    }
};

const getStyles = (type, subType) => {
    if (!styles[type]) {
        throw new Error(`Unknown style type '${type}'`);
    }
    if (!styles[type][subType]) {
        console.log(`No styles for ${type}/${subType}`)
        return styles[type].default;
    }
    return {...styles[type].default, ...styles[type][subType]};
}

function InlineElement (props) {
    const [display, setDisplay] = useState(false);
    const toggleDisplay = () => setDisplay(!display);
    if (display) {
        return <div
            style={{
                ...props.style,
                paddingLeft: "0.5em",
                paddingRight: "0.5em",
                backgroundColor: "#CCC",
                marginTop: "1em",
                marginBottom: "1em"
            }}
            onClick={toggleDisplay}
        >
            {props.children}
        </div>
    } else {
        return <span
            style={{
                verticalAlign: "super",
                fontSize: "x-small",
                fontWeight: "bold",
                marginRight: "0.25em",
                padding: "2px",
                backgroundColor: "#CCC"
            }}
            onClick={toggleDisplay}
        >
        {props.linkText}
    </span>
    }
}

const renderers = {
    text: text => text,
    chapter_label: number => <span style={getStyles('marks', "chapter_label")}>{number}</span>,
    verses_label: number => <span style={getStyles('marks', "verses_label")}>{number}</span>,
    paragraph: (subType, content) =>
        ["usfm:f", "usfm:x"].includes(subType) ?
            <InlineElement
                style={getStyles('paras', subType)}
                linkText={subType === "usfm:f" ? "*" : "x"}
            >
                {content}
            </InlineElement> :
            <p style={getStyles('paras', subType)}>{content}</p>,
    wrapper: (subType, content) => <span style={getStyles('wrappers', subType)}>{content}</span>,
    mergeParas: paras => paras,
}

export {renderers, styles};
