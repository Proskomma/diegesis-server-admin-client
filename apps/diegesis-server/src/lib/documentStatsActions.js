const documentStatsActions = {
    startDocument: [
        {
            description: "Set up document stats record",
            test: () => true,
            action: ({output}) => {
                for (const stat of [
                    "nIntroductions",
                    "nXrefs",
                    "nFootnotes",
                    "nHeadings",
                    "nStrong",
                    "nLemma",
                    "nGloss",
                    "nContent",
                    "nOccurrences",
                    "nChapters",
                    "nVerses",
                    "nMorph",
                ]) {
                    output[stat] = 0;
                }
            }
        }
    ],
    blockGraft: [
        {
            description: "Process block grafts",
            test: () => true,
            action: (environment) => {
                const currentBlock = environment.context.sequences[0].block;
                if (currentBlock.target) {
                    if (currentBlock.subType === 'heading') {
                        environment.output.nHeadings++;
                    }
                    if (currentBlock.subType === 'introduction') {
                        environment.output.nIntroductions++;
                    }
                    environment.context.renderer.renderSequenceId(environment, currentBlock.target);
                }
            }
        },
    ],
    inlineGraft: [
        {
            description: "Process inline grafts",
            test: () => true,
            action: (environment) => {
                const element = environment.context.sequences[0].element;
                if (element.subType === 'footnote') {
                    environment.output.nFootnotes++;
                }
                if (element.subType === 'xref') {
                    environment.output.nXrefs++;
                }
                if (element.target) {
                    environment.context.renderer.renderSequenceId(environment, element.target);
                }
            }
        },
    ],
    startMilestone: [
        {
            description: "Handle zaln word-like atts",
            test: ({context}) => context.sequences[0].element.subType === "usfm:zaln",
            action: ({context, workspace, output}) => {
                const atts = context.sequences[0].element.atts;
                const standardAtts = {};
                for (const key of Object.keys(atts)) {
                    if (["x-strong", "x-lemma", "x-morph", "x-content", "x-occurrences"].includes(key)) {
                        const keyRoot = key.split('-')[1];
                        output[`n${keyRoot[0].toUpperCase()}${keyRoot.slice(1)}`]++;
                    }
                }
            }
        },
    ],
    startWrapper: [
        {
            description: "Handle standard w attributes",
            test: ({context}) => context.sequences[0].element.subType === "usfm:w",
            action: ({context, output}) => {
                const atts = context.sequences[0].element.atts;
                for (const key of Object.keys(atts)) {
                    if (["strong", "lemma", "gloss"].includes(key)) {
                        output[`n${key[0].toUpperCase()}${key.slice(1)}`]++;
                    }
                }
            }
        }
    ],
    mark: [
        {
            description: "Track chapters and verses",
            test: () => true,
            action: ({config, context, workspace, output}) => {
                const element = context.sequences[0].element;
                if (element.subType === "chapter") {
                    output.nChapters++;
                }
                if (element.subType === "verses") {
                    output.nVerses++;
                }
            }
        },
    ],
};

module.exports = documentStatsActions;
