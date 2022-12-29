import {renderers, styles} from './render2react';

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
    inlineGraft: [
        {
            description: "identity",
            test: ({context}) => context.sequences[0].element.subType !== "note_caller",
            action: (environment) => {
                const element = environment.context.sequences[0].element;
                const graftRecord = {
                    type: element.type,
                };
                if (element.sequence) {
                    graftRecord.sequence = {};
                    const cachedSequencePointer = environment.workspace.currentSequence;
                    const cachedParaContentStack = [...environment.workspace.paraContentStack];
                    const cachedWebParas = environment.workspace.webParas;
                    environment.workspace.webParas = [];
                    environment.workspace.currentSequence = graftRecord.sequence;
                    environment.context.renderer.renderSequence(environment);
                    const sequencePseudoParas = environment.workspace.webParas;
                    environment.workspace.webParas = cachedWebParas;
                    environment.workspace.paraContentStack = cachedParaContentStack;
                    environment.workspace.paraContentStack[0].content.push(sequencePseudoParas);
                    environment.workspace.currentSequence = cachedSequencePointer;
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
