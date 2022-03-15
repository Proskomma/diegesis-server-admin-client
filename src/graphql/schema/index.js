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
      nCatalogEntries: Int!
      """The translations that are available from this organization"""
      catalogEntries: [TranslationCatalogEntry!]!
      """Content for the translation of this organization with the given id, if found"""
      translationContent(
        """The id of the translation"""
        id: String!
      ): TranslationContent
    }
    """A catalog entry for a Scripture translation"""
    type TranslationCatalogEntry {
      """An id for the translation which is unique within the organization"""
      id: String!
      """The language code"""
      languageCode: String!
      """The autonym of the language (ie the name of the language in that language)"""
      languageLocalName: String!
      """The name of the language in English"""
      languageEnglishName: String!
      """A long title for the translation"""
      longTitle: String!
      """A short title for the translation"""
      shortTitle: String!
      """A description of the translation"""
      description: String!
      """The copyright notice for the translation"""
      copyright: String!
    }
    """Content for a translation"""
    type TranslationContent {
      """The number of Scripture books in the translation"""
      nScriptureBooks: Int!
      scriptureBookCodes: [String!]!
    }
  `;
