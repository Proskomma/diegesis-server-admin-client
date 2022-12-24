import React from 'react';

const sofria2WebActions = {
    startDocument: [
        {
            description: "Set up",
            test: () => true,
            action: ({config, context, workspace, output}) => {
                workspace.webParas = [];
            },
        }
    ],
    startParagraph: [
        {
            description: "Add new para object",
            test: () => true,
            action: ({context, workspace, output}) => {
                workspace.webParas.push({content: []});
            }
        },
    ],
    text: [
        {
            description: "Push text to para",
            test: () => true,
            action: ({context, workspace, output}) => {
                const element = context.sequences[0].element;
                workspace.webParas[workspace.webParas.length - 1].content.push(element.text);
            }
        },
    ],
    mark: [
        {
            description: "Show chapter/verse markers",
            test: () => true,
            action: ({context, workspace}) => {
                const element = context.sequences[0].element;
                if (["chapter_label", "verses_label"].includes(element.subType)) {
                    workspace.webParas[workspace.webParas.length - 1].content.push(<b>{element.atts.number}</b>);
                }
            }
        },
    ],
    endDocument: [
        {
            description: "Build JSX",
            test: () => true,
            action: ({config, context, workspace, output}) =>
                output.paras = workspace.webParas.map(p => <p>{p.content}</p>),
        }
    ],
};

export default sofria2WebActions;
