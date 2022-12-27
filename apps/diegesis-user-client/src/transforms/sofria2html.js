import React from 'react';

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
        "usfm:tr": {}
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
        "usfm:fm": {},
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
        }
    }
};

const renderers = {
    text: text => text,
    chapter_label: number => <span style={getStyles('marks', "chapter_label")}>{number}</span>,
    verses_label: number => <span style={getStyles('marks', "verses_label")}>{number}</span>,
    paragraph: (subType, content) => <p style={getStyles('paras', subType)}>{content}</p>,
    wrapper: (subType, content) => <span style={getStyles('wrappers', subType)}>{content}</span>,
    mergeParas: paras => paras,
}

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

const sofria2WebActions = {
    startDocument: [
        {
            description: "Set up",
            test: () => true,
            action: ({config, context, workspace, output}) => {
                workspace.webParas = [];
                output.sofria = {};
                output.sofria.sequence = {};
                workspace.currentSequence = output.sofria.sequence;
                workspace.paraContentStack = [];
            },
        }
    ],
    startSequence: [
        {
            description: "identity",
            test: () => true,
            action: ({context, workspace}) => {
                workspace.currentSequence.type = context.sequences[0].type;
                workspace.currentSequence.blocks = [];
            }
        },
    ],
    endSequence: [
        {
            description: "identity",
            test: () => true,
            action: ({workspace}) => {
                workspace.currentSequence = null;
            }
        },
    ],
    blockGraft: [
        {
            description: "Process block grafts",
            test: () => true,
            action: (environment) => {
                const currentBlock = environment.context.sequences[0].block;
                if (currentBlock.subType !== "remark") {
                    const graftRecord = {
                        type: currentBlock.type,
                    };
                    if (currentBlock.sequence) {
                        graftRecord.sequence = {};
                        const cachedSequencePointer = environment.workspace.currentSequence;
                        environment.workspace.currentSequence = graftRecord.sequence;
                        const cachedParaContentStack = environment.workspace.paraContentStack;
                        environment.context.renderer.renderSequence(environment);
                        environment.workspace.paraContentStack = cachedParaContentStack;
                        environment.workspace.currentSequence = cachedSequencePointer;
                    }
                    environment.workspace.currentSequence.blocks.push(graftRecord);
                }
            }
        },
    ],
    startParagraph: [
        {
            description: "Initialise content stack",
            test: () => true,
            action: ({context, workspace, output}) => {
                // console.log("startPara");
                const block = context.sequences[0].block;
                workspace.paraContentStack = [
                    {
                        subType: block.subType,
                        content: []
                    }
                ]
            }
        },
    ],
    endParagraph: [
        {
            description: "Add completed para to webParas",
            test: () => true,
            action: ({context, workspace, output}) => {
                // console.log("endPara");
                workspace.webParas.push(
                    renderers.paragraph(
                        workspace.paraContentStack[0].subType,
                        workspace.paraContentStack[0].content
                    )
                );
            }
        },
    ],
    startWrapper: [
        {
            description: "Push to paraContent Stack",
            test: ({context}) => !["chapter", "verses", "usfm:w"].includes(context.sequences[0].element.subType),
            action: ({context, workspace, output}) => {
                const pushed = {
                    subType: context.sequences[0].element.subType,
                    content: []
                };
                // console.log("startWrapper", pushed, workspace.paraContentStack.length);
                workspace.paraContentStack.unshift(
                    pushed
                );
            }
        },
    ],
    endWrapper: [
        {
            description: "Collapse one level of paraContent Stack",
            test: ({context}) => !["chapter", "verses", "usfm:w"].includes(context.sequences[0].element.subType),
            action: ({context, workspace, output}) => {
                const popped = workspace.paraContentStack.shift();
                // console.log("endWrapper", popped, workspace.paraContentStack.length);
                workspace.paraContentStack[0].content.push(renderers.wrapper(popped.subType, popped.content));
            }
        },
    ],
    text: [
        {
            description: "Push text to para",
            test: () => true,
            action: ({context, workspace, output}) => {
                const element = context.sequences[0].element;
                workspace.paraContentStack[0].content.push(renderers.text(element.text));
            }
        },
    ],
    mark: [
        {
            description: "Show chapter/verse markers",
            test: () => true,
            action: ({context, workspace}) => {
                const element = context.sequences[0].element;
                if (element.subType === "chapter_label") {
                    workspace.paraContentStack[0].content.push(renderers.chapter_label(element.atts.number));
                } else if (element.subType === "verses_label") {
                    workspace.paraContentStack[0].content.push(renderers.verses_label(element.atts.number));
                }
            }
        },
    ],
    endDocument: [
        {
            description: "Build JSX",
            test: () => true,
            action: ({config, context, workspace, output}) => {
                output.paras = renderers.mergeParas(workspace.webParas);
            }
        }
    ],
};

export default sofria2WebActions;
