import { gql } from "apollo-server-express";

export default gql`
    type Query {
      """A list of organizations from which this server can serve data"""
      orgs: [Org!]!
      """The organization with the given name, if found"""
      org(
          """The name of the organization"""
          name: String!
        ): Org
    }
    """An organization from which this server can serve data"""
    type Org {
      """A short name for the organization"""
      name: String!
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
          withId: [String!]
          """Filter according to presence or absence of USFM"""
          withUsfm: Boolean
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
        id: String!
      ): Translation
    }
    """A Scripture translation"""
    type Translation {
      """An id for the translation which is unique within the organization"""
      id: String!
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
      """The number of Scripture books in this translation"""
      nUsfmBooks: Int
      """The bookCodes of Scripture books as USFM in this translation"""
      usfmBookCodes: [String!]
      """Whether or not USFM for this bookCode is present for this translation"""
      hasUsfmBookCode(
        """The bookCode (3-char upper-case Paratext format)"""
        code: String!
      ): Boolean
      """Is USFM available?"""
      hasUsfm: Boolean!
      """The USFM for this translation"""
      usfmForBookCode(
        """The bookCode"""
        code: String!
      ): String
      """Is USX available?"""
      hasUsx: Boolean!
      """The USX for this translation"""
      usxForBookCode(
        """The bookCode"""
        code: String!
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
        org: String!
        """The organization-specific identifier of the translation"""
        translationId: String!
      ) : Boolean! 
      """Fetches and processes the specified USX content from a remote server"""
      fetchUsx(
        """The name of the organization"""
        org: String!
        """The organization-specific identifier of the translation"""
        translationId: String!
      ) : Boolean! 
    }
  `;
