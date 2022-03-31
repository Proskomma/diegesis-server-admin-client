import {gql} from "apollo-server-express";

export default gql`
    scalar OrgName
    scalar TranslationId
    scalar BookCode
    type Query {
        """A list of organizations from which this server can serve data"""
        orgs: [Org!]!
        """The organization with the given name, if found"""
        org(
            """The name of the organization"""
            name: OrgName!
        ): Org
    }
    """An organization from which this server can serve data"""
    type Org {
        """A short name for the organization"""
        name: OrgName!
        """The number of translations for this organization"""
        nTranslations(
            """Only count translations with USFM"""
            withUsfm: Boolean
            """Only count translations with USX"""
            withUsx: Boolean
        )
        : Int!
        """The translations that are available from this organization"""
        translations(
            """The ids of the translations"""
            withId: [TranslationId!]
            """Filter according to presence or absence of USFM"""
            withUsfm: Boolean
            """Filter according to presence or absence of USX"""
            withUsx: Boolean
            """Filter by language codes"""
            withLanguageCode: [String!]
            """Filter by text matches in title or description"""
            withMatchingMetadata: [String!]
            """Sort by id, languageCode, languageName or title"""
            sortedBy: String
            reverse: Boolean
        ): [Translation!]!
        """Content for the translation of this organization with the given id, if found"""
        translation(
            """The id of the translation"""
            id: TranslationId!
        ): Translation
    }
    """A Scripture translation"""
    type Translation {
        """An id for the translation which is unique within the organization"""
        id: TranslationId!
        """The language code"""
        languageCode: String!
        """A name of the language"""
        languageName: String!
        """a title of the translation"""
        title: String!
        """A description of the translation"""
        description: String!
        """The copyright notice or owner of the translation"""
        copyright: String!
        """The number of Scripture books as USFM in this translation"""
        nUsfmBooks: Int
        """The bookCodes of Scripture books as USFM in this translation"""
        usfmBookCodes: [BookCode!]
        """Whether or not USFM for this bookCode is present for this translation"""
        hasUsfmBookCode(
            """The bookCode (3-char upper-case Paratext format)"""
            code: BookCode!
        ): Boolean
        """Is USFM available?"""
        hasUsfm: Boolean!
        """The USFM for this translation"""
        usfmForBookCode(
            """The bookCode"""
            code: BookCode!
        ): String
        nUsxBooks: Int
        """The bookCodes of Scripture books as USX in this translation"""
        usxBookCodes: [BookCode!]
        """Whether or not USX for this bookCode is present for this translation"""
        hasUsxBookCode(
            """The bookCode (3-char upper-case Paratext format)"""
            code: BookCode!
        ): Boolean
        """Is USX available?"""
        hasUsx: Boolean!
        """The USX for this translation"""
        usxForBookCode(
            """The bookCode"""
            code: BookCode!
        ): String
        """Is Proskomma succinct docSet available?"""
        hasSuccinct: Boolean!
        """The Proskomma succinct docSet for this translation"""
        succinct: String
    }
    type Mutation {
        """Fetches and processes the specified USFM content from a remote server"""
        fetchUsfm(
            """The name of the organization"""
            org: OrgName!
            """The organization-specific identifier of the translation"""
            translationId: TranslationId!
        ) : Boolean!
        """Fetches and processes the specified USX content from a remote server"""
        fetchUsx(
            """The name of the organization"""
            org: OrgName!
            """The organization-specific identifier of the translation"""
            translationId: TranslationId!
        ) : Boolean!
    }
`;
