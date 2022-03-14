import { gql } from "apollo-server-express";

export default gql`
    type Query {
      """A list of organizations from which this server can serve data"""
      orgs: [Org!]!
    }
    """An organization from which this server can serve data"""
    type Org {
      """A short name for the organization"""
      name: String!
      """The translations that are available from this organization"""
      translations: [Translation!]!
    }
    """A Scripture translation"""
    type Translation {
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
  `;
