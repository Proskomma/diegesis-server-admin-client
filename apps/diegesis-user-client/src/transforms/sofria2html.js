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
      "usfm:p": {
          textIndent: "1.5em"
      },
      "usfm:m": {},
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
  }
};

const renderers = {
    text: text => text,
    chapter_label: number => <span style={getStyles('marks', "chapter_label")}>{number}</span>,
    verses_label: number => <span style={getStyles('marks', "verses_label")}>{number}</span>,
    paragraph: (subType, content) => <p style={getStyles('paras', subType)}>{content}</p>,
    mergeParas: paras => paras.map(p => renderers.paragraph(p.subType, p.content)),
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
                const graftRecord = {
                    type: currentBlock.type,
                };
                if (currentBlock.sequence) {
                    graftRecord.sequence = {};
                    const cachedSequencePointer = environment.workspace.currentSequence;
                    environment.workspace.currentSequence = graftRecord.sequence;
                    environment.context.renderer.renderSequence(environment);
                    environment.workspace.currentSequence = cachedSequencePointer;
                }
                environment.workspace.currentSequence.blocks.push(graftRecord);
            }
        },
    ],
    startParagraph: [
        {
            description: "Add new para object",
            test: () => true,
            action: ({context, workspace, output}) => {
                const block = context.sequences[0].block;
                workspace.webParas.push({
                    subType: block.subType,
                    content: []
                });
            }
        },
    ],
    text: [
        {
            description: "Push text to para",
            test: () => true,
            action: ({context, workspace, output}) => {
                const element = context.sequences[0].element;
                workspace.webParas[workspace.webParas.length - 1].content.push(renderers.text(element.text));
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
                    workspace.webParas[workspace.webParas.length - 1].content.push(renderers.chapter_label(element.atts.number));
                } else if (element.subType === "verses_label") {
                    workspace.webParas[workspace.webParas.length - 1].content.push(renderers.verses_label(element.atts.number));
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
