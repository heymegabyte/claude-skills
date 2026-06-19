# openai-mcp MCP Server

Auto-generated from OpenAPI spec by `forge-skill-from-openapi --target=mcp-server`.
Transport: **stdio**

## Tools (242)

- `listAssistants` — Returns a list of assistants.
- `createAssistant` — Create an assistant with a model and instructions.
- `getAssistant` — Retrieves an assistant.
- `modifyAssistant` — Modifies an assistant.
- `deleteAssistant` — Delete an assistant.
- `createSpeech` — Generates audio from the input text.

Returns the audio file content, or a stream of audio events.

- `createTranscription` — Transcribes audio into the input language.

Returns a transcription object in `json`, `diarized_json`, or `verbose_json`
format, or a stream of transcript events.

- `createTranslation` — Translates audio into English.
- `listVoiceConsents` — Returns a list of voice consent recordings.
- `createVoiceConsent` — Upload a voice consent recording.
- `getVoiceConsent` — Retrieves a voice consent recording.
- `updateVoiceConsent` — Updates a voice consent recording (metadata only).
- `deleteVoiceConsent` — Deletes a voice consent recording.
- `createVoice` — Creates a custom voice.
- `listBatches` — List your organization's batches.
- `createBatch` — Creates and executes a batch from an uploaded file of requests
- `retrieveBatch` — Retrieves a batch.
- `cancelBatch` — Cancels an in-progress batch. The batch will be in status `cancelling` for up to 10 minutes, before changing to `cancelled`, where it will have partial results (if any) available in the output file.
- `listChatCompletions` — List stored Chat Completions. Only Chat Completions that have been stored
with the `store` parameter set to `true` will be returned.

- `createChatCompletion` — **Starting a new project?** We recommend trying [Responses](/docs/api-reference/responses)
to take advantage of the latest OpenAI platform features. Compare
[Chat Completions with Responses](/docs/guides/responses-vs-chat-completions?api-mode=responses).

---

Creates a model response for the given chat conversation. Learn more in the
[text generation](/docs/guides/text-generation), [vision](/docs/guides/vision),
and [audio](/docs/guides/audio) guides.

Parameter support can differ depending on the model used to generate the
response, particularly for newer reasoning models. Parameters that are only
supported for reasoning models are noted below. For the current state of
unsupported parameters in reasoning models,
[refer to the reasoning guide](/docs/guides/reasoning).

Returns a chat completion object, or a streamed sequence of chat completion
chunk objects if the request is streamed.

- `getChatCompletion` — Get a stored chat completion. Only Chat Completions that have been created
with the `store` parameter set to `true` will be returned.

- `updateChatCompletion` — Modify a stored chat completion. Only Chat Completions that have been
created with the `store` parameter set to `true` can be modified. Currently,
the only supported modification is to update the `metadata` field.

- `deleteChatCompletion` — Delete a stored chat completion. Only Chat Completions that have been
created with the `store` parameter set to `true` can be deleted.

- `getChatCompletionMessages` — Get the messages in a stored chat completion. Only Chat Completions that
have been created with the `store` parameter set to `true` will be
returned.

- `createCompletion` — Creates a completion for the provided prompt and parameters.

Returns a completion object, or a sequence of completion objects if the request is streamed.

- `ListContainers` — List Containers
- `CreateContainer` — Create Container
- `RetrieveContainer` — Retrieve Container
- `DeleteContainer` — Delete Container
- `ListContainerFiles` — List Container files
- `CreateContainerFile` — Create a Container File

You can send either a multipart/form-data request with the raw file content, or a JSON request with a file ID.

- `RetrieveContainerFile` — Retrieve Container File
- `DeleteContainerFile` — Delete Container File
- `RetrieveContainerFileContent` — Retrieve Container File Content
- `listConversationItems` — List all items for a conversation with the given ID.
- `createConversationItems` — Create items in a conversation with the given ID.
- `getConversationItem` — Get a single item from a conversation with the given IDs.
- `deleteConversationItem` — Delete an item from a conversation with the given IDs.
- `createEmbedding` — Creates an embedding vector representing the input text.
- `listEvals` — List evaluations for a project.

- `createEval` — Create the structure of an evaluation that can be used to test a model's performance.
An evaluation is a set of testing criteria and the config for a data source, which dictates the schema of the data used in the evaluation. After creating an evaluation, you can run it on different models and model parameters. We support several types of graders and datasources.
For more information, see the [Evals guide](/docs/guides/evals).

- `getEval` — Get an evaluation by ID.

- `updateEval` — Update certain properties of an evaluation.

- `deleteEval` — Delete an evaluation.

- `getEvalRuns` — Get a list of runs for an evaluation.

- `createEvalRun` — Kicks off a new run for a given evaluation, specifying the data source, and what model configuration to use to test. The datasource will be validated against the schema specified in the config of the evaluation.

- `getEvalRun` — Get an evaluation run by ID.

- `cancelEvalRun` — Cancel an ongoing evaluation run.

- `deleteEvalRun` — Delete an eval run.

- `getEvalRunOutputItems` — Get a list of output items for an evaluation run.

- `getEvalRunOutputItem` — Get an evaluation run output item by ID.

- `listFiles` — Returns a list of files.
- `createFile` — Upload a file that can be used across various endpoints. Individual files
can be up to 512 MB, and each project can store up to 2.5 TB of files in
total. There is no organization-wide storage limit. Uploads to this
endpoint are rate-limited to 1,000 requests per minute per authenticated
user.

- The Assistants API supports files up to 2 million tokens and of specific
  file types. See the [Assistants Tools guide](/docs/assistants/tools) for
  details.
- The Fine-tuning API only supports `.jsonl` files. The input also has
  certain required formats for fine-tuning
  [chat](/docs/api-reference/fine-tuning/chat-input) or
  [completions](/docs/api-reference/fine-tuning/completions-input) models.
- The Batch API only supports `.jsonl` files up to 200 MB in size. The input
  also has a specific required
  [format](/docs/api-reference/batch/request-input).
- For Retrieval or `file_search` ingestion, upload files here first. If
  you need to attach multiple uploaded files to the same vector store, use
  [`/vector_stores/{vector_store_id}/file_batches`](/docs/api-reference/vector-stores-file-batches/createBatch)
  instead of attaching them one by one. Vector store attachment has separate
  limits from file upload, including 2,000 attached files per minute per
  organization.

Please [contact us](https://help.openai.com/) if you need to increase these
storage limits.

- `retrieveFile` — Returns information about a specific file.
- `deleteFile` — Delete a file and remove it from all vector stores.
- `downloadFile` — Returns the contents of the specified file.
- `runGrader` — Run a grader.

- `validateGrader` — Validate a grader.

- `listFineTuningCheckpointPermissions` — **NOTE:** This endpoint requires an [admin API key](https://platform.openai.com/settings/organization/admin-keys).

Organization owners can use this endpoint to view all permissions for a fine-tuned model checkpoint.

- `createFineTuningCheckpointPermission` — **NOTE:** Calling this endpoint requires an [admin API key](https://platform.openai.com/settings/organization/admin-keys).

This enables organization owners to share fine-tuned models with other projects in their organization.

- `deleteFineTuningCheckpointPermission` — **NOTE:** This endpoint requires an [admin API key](https://platform.openai.com/settings/organization/admin-keys).

Organization owners can use this endpoint to delete a permission for a fine-tuned model checkpoint.

- `listPaginatedFineTuningJobs` — List your organization's fine-tuning jobs

- `createFineTuningJob` — Creates a fine-tuning job which begins the process of creating a new model from a given dataset.

Response includes details of the enqueued job including job status and the name of the fine-tuned models once complete.

[Learn more about fine-tuning](/docs/guides/model-optimization)

- `retrieveFineTuningJob` — Get info about a fine-tuning job.

[Learn more about fine-tuning](/docs/guides/model-optimization)

- `cancelFineTuningJob` — Immediately cancel a fine-tune job.

- `listFineTuningJobCheckpoints` — List checkpoints for a fine-tuning job.

- `listFineTuningEvents` — Get status updates for a fine-tuning job.

- `pauseFineTuningJob` — Pause a fine-tune job.

- `resumeFineTuningJob` — Resume a fine-tune job.

- `createImageEdit` — Creates an edited or extended image given one or more source images and a prompt. This endpoint supports GPT Image models (`gpt-image-1.5`, `gpt-image-1`, `gpt-image-1-mini`, and `chatgpt-image-latest`) and `dall-e-2`.
- `createImage` — Creates an image given a prompt. [Learn more](/docs/guides/images).

- `createImageVariation` — Creates a variation of a given image. This endpoint only supports `dall-e-2`.
- `listModels` — Lists the currently available models, and provides basic information about each one such as the owner and availability.
- `retrieveModel` — Retrieves a model instance, providing basic information about the model such as the owner and permissioning.
- `deleteModel` — Delete a fine-tuned model. You must have the Owner role in your organization to delete a model.
- `createModeration` — Classifies if text and/or image inputs are potentially harmful. Learn
more in the [moderation guide](/docs/guides/moderation).

- `admin-api-keys-list` — List organization API keys
- `admin-api-keys-create` — Create an organization admin API key
- `admin-api-keys-get` — Retrieve a single organization API key
- `admin-api-keys-delete` — Delete an organization admin API key
- `list-audit-logs` — List user actions and configuration changes within this organization.
- `listOrganizationCertificates` — List uploaded certificates for this organization.
- `uploadCertificate` — Upload a certificate to the organization. This does **not** automatically activate the certificate.

Organizations can upload up to 50 certificates.

- `activateOrganizationCertificates` — Activate certificates at the organization level.

You can atomically and idempotently activate up to 10 certificates at a time.

- `deactivateOrganizationCertificates` — Deactivate certificates at the organization level.

You can atomically and idempotently deactivate up to 10 certificates at a time.

- `getCertificate` — Get a certificate that has been uploaded to the organization.

You can get a certificate regardless of whether it is active or not.

- `modifyCertificate` — Modify a certificate. Note that only the name can be modified.

- `deleteCertificate` — Delete a certificate from the organization.

The certificate must be inactive for the organization and all projects.

- `usage-costs` — Get costs details for the organization.
- `list-groups` — Lists all groups in the organization.
- `create-group` — Creates a new group in the organization.
- `update-group` — Updates a group's information.
- `delete-group` — Deletes a group from the organization.
- `list-group-role-assignments` — Lists the organization roles assigned to a group within the organization.
- `assign-group-role` — Assigns an organization role to a group within the organization.
- `unassign-group-role` — Unassigns an organization role from a group within the organization.
- `list-group-users` — Lists the users assigned to a group.
- `add-group-user` — Adds a user to a group.
- `remove-group-user` — Removes a user from a group.
- `list-invites` — Returns a list of invites in the organization.
- `inviteUser` — Create an invite for a user to the organization. The invite must be accepted by the user before they have access to the organization.
- `retrieve-invite` — Retrieves an invite.
- `delete-invite` — Delete an invite. If the invite has already been accepted, it cannot be deleted.
- `list-projects` — Returns a list of projects.
- `create-project` — Create a new project in the organization. Projects can be created and archived, but cannot be deleted.
- `retrieve-project` — Retrieves a project.
- `modify-project` — Modifies a project in the organization.
- `list-project-api-keys` — Returns a list of API keys in the project.
- `retrieve-project-api-key` — Retrieves an API key in the project.
- `delete-project-api-key` — Deletes an API key from the project.

Returns confirmation of the key deletion, or an error if the key belonged to
a service account.

- `archive-project` — Archives a project in the organization. Archived projects cannot be used or updated.
- `listProjectCertificates` — List certificates for this project.
- `activateProjectCertificates` — Activate certificates at the project level.

You can atomically and idempotently activate up to 10 certificates at a time.

- `deactivateProjectCertificates` — Deactivate certificates at the project level. You can atomically and 
idempotently deactivate up to 10 certificates at a time.

- `list-project-groups` — Lists the groups that have access to a project.
- `add-project-group` — Grants a group access to a project.
- `remove-project-group` — Revokes a group's access to a project.
- `list-project-rate-limits` — Returns the rate limits per model for a project.
- `update-project-rate-limits` — Updates a project rate limit.
- `list-project-service-accounts` — Returns a list of service accounts in the project.
- `create-project-service-account` — Creates a new service account in the project. This also returns an unredacted API key for the service account.
- `retrieve-project-service-account` — Retrieves a service account in the project.
- `delete-project-service-account` — Deletes a service account from the project.

Returns confirmation of service account deletion, or an error if the project
is archived (archived projects have no service accounts).

- `list-project-users` — Returns a list of users in the project.
- `create-project-user` — Adds a user to the project. Users must already be members of the organization to be added to a project.
- `retrieve-project-user` — Retrieves a user in the project.
- `modify-project-user` — Modifies a user's role in the project.
- `delete-project-user` — Deletes a user from the project.

Returns confirmation of project user deletion, or an error if the project is
archived (archived projects have no users).

- `list-roles` — Lists the roles configured for the organization.
- `create-role` — Creates a custom role for the organization.
- `update-role` — Updates an existing organization role.
- `delete-role` — Deletes a custom role from the organization.
- `usage-audio-speeches` — Get audio speeches usage details for the organization.
- `usage-audio-transcriptions` — Get audio transcriptions usage details for the organization.
- `usage-code-interpreter-sessions` — Get code interpreter sessions usage details for the organization.
- `usage-completions` — Get completions usage details for the organization.
- `usage-embeddings` — Get embeddings usage details for the organization.
- `usage-images` — Get images usage details for the organization.
- `usage-moderations` — Get moderations usage details for the organization.
- `usage-vector-stores` — Get vector stores usage details for the organization.
- `list-users` — Lists all of the users in the organization.
- `retrieve-user` — Retrieves a user by their identifier.
- `modify-user` — Modifies a user's role in the organization.
- `delete-user` — Deletes a user from the organization.
- `list-user-role-assignments` — Lists the organization roles assigned to a user within the organization.
- `assign-user-role` — Assigns an organization role to a user within the organization.
- `unassign-user-role` — Unassigns an organization role from a user within the organization.
- `list-project-group-role-assignments` — Lists the project roles assigned to a group within a project.
- `assign-project-group-role` — Assigns a project role to a group within a project.
- `unassign-project-group-role` — Unassigns a project role from a group within a project.
- `list-project-roles` — Lists the roles configured for a project.
- `create-project-role` — Creates a custom role for a project.
- `update-project-role` — Updates an existing project role.
- `delete-project-role` — Deletes a custom role from a project.
- `list-project-user-role-assignments` — Lists the project roles assigned to a user within a project.
- `assign-project-user-role` — Assigns a project role to a user within a project.
- `unassign-project-user-role` — Unassigns a project role from a user within a project.
- `create-realtime-call` — Create a new Realtime API call over WebRTC and receive the SDP answer needed
to complete the peer connection.
- `accept-realtime-call` — Accept an incoming SIP call and configure the realtime session that will
handle it.
- `hangup-realtime-call` — End an active Realtime API call, whether it was initiated over SIP or
WebRTC.
- `refer-realtime-call` — Transfer an active SIP call to a new destination using the SIP REFER verb.
- `reject-realtime-call` — Decline an incoming SIP call by returning a SIP status code to the caller.
- `create-realtime-client-secret` — Create a Realtime client secret with an associated session configuration.

Client secrets are short-lived tokens that can be passed to a client app,
such as a web frontend or mobile client, which grants access to the Realtime API without
leaking your main API key. You can configure a custom TTL for each client secret.

You can also attach session configuration options to the client secret, which will be
applied to any sessions created using that client secret, but these can also be overridden
by the client connection.

[Learn more about authentication with client secrets over WebRTC](/docs/guides/realtime-webrtc).

Returns the created client secret and the effective session object. The client secret is a string that looks like `ek_1234`.

- `create-realtime-session` — Create an ephemeral API token for use in client-side applications with the
Realtime API. Can be configured with the same session parameters as the
`session.update` client event.

It responds with a session object, plus a `client_secret` key which contains
a usable ephemeral API token that can be used to authenticate browser clients
for the Realtime API.

Returns the created Realtime session object, plus an ephemeral key.

- `create-realtime-transcription-session` — Create an ephemeral API token for use in client-side applications with the
Realtime API specifically for realtime transcriptions. 
Can be configured with the same session parameters as the `transcription_session.update` client event.

It responds with a session object, plus a `client_secret` key which contains
a usable ephemeral API token that can be used to authenticate browser clients
for the Realtime API.

Returns the created Realtime transcription session object, plus an ephemeral key.

- `create-realtime-translation-client-secret` — Create a Realtime translation client secret with an associated translation session configuration.

Client secrets are short-lived tokens that can be passed to a client app,
such as a web frontend or mobile client, which grants access to the Realtime
Translation API without leaking your main API key. You can configure a custom
TTL for each client secret.

Returns the created client secret and the effective translation session object.
The client secret is a string that looks like `ek_1234`.

- `createResponse` — Creates a model response. Provide [text](/docs/guides/text) or
[image](/docs/guides/images) inputs to generate [text](/docs/guides/text)
or [JSON](/docs/guides/structured-outputs) outputs. Have the model call
your own [custom code](/docs/guides/function-calling) or use built-in
[tools](/docs/guides/tools) like [web search](/docs/guides/tools-web-search)
or [file search](/docs/guides/tools-file-search) to use your own data
as input for the model's response.

- `getResponse` — Retrieves a model response with the given ID.

- `deleteResponse` — Deletes a model response with the given ID.

- `cancelResponse` — Cancels a model response with the given ID. Only responses created with
the `background` parameter set to `true` can be cancelled. 
[Learn more](/docs/guides/background).

- `listInputItems` — Returns a list of input items for a given response.
- `createThread` — Create a thread.
- `createThreadAndRun` — Create a thread and run it in one request.
- `getThread` — Retrieves a thread.
- `modifyThread` — Modifies a thread.
- `deleteThread` — Delete a thread.
- `listMessages` — Returns a list of messages for a given thread.
- `createMessage` — Create a message.
- `getMessage` — Retrieve a message.
- `modifyMessage` — Modifies a message.
- `deleteMessage` — Deletes a message.
- `listRuns` — Returns a list of runs belonging to a thread.
- `createRun` — Create a run.
- `getRun` — Retrieves a run.
- `modifyRun` — Modifies a run.
- `cancelRun` — Cancels a run that is `in_progress`.
- `listRunSteps` — Returns a list of run steps belonging to a run.
- `getRunStep` — Retrieves a run step.
- `submitToolOuputsToRun` — When a run has the `status: "requires_action"` and `required_action.type` is `submit_tool_outputs`, this endpoint can be used to submit the outputs from the tool calls once they're all completed. All outputs must be submitted in a single request.

- `createUpload` — Creates an intermediate [Upload](/docs/api-reference/uploads/object) object
that you can add [Parts](/docs/api-reference/uploads/part-object) to.
Currently, an Upload can accept at most 8 GB in total and expires after an
hour after you create it.

Once you complete the Upload, we will create a
[File](/docs/api-reference/files/object) object that contains all the parts
you uploaded. This File is usable in the rest of our platform as a regular
File object.

For certain `purpose` values, the correct `mime_type` must be specified. 
Please refer to documentation for the 
[supported MIME types for your use case](/docs/assistants/tools/file-search#supported-files).

For guidance on the proper filename extensions for each purpose, please
follow the documentation on [creating a
File](/docs/api-reference/files/create).

Returns the Upload object with status `pending`.

- `cancelUpload` — Cancels the Upload. No Parts may be added after an Upload is cancelled.

Returns the Upload object with status `cancelled`.

- `completeUpload` — Completes the [Upload](/docs/api-reference/uploads/object). 

Within the returned Upload object, there is a nested [File](/docs/api-reference/files/object) object that is ready to use in the rest of the platform.

You can specify the order of the Parts by passing in an ordered list of the Part IDs.

The number of bytes uploaded upon completion must match the number of bytes initially specified when creating the Upload object. No Parts may be added after an Upload is completed.
Returns the Upload object with status `completed`, including an additional `file` property containing the created usable File object.

- `addUploadPart` — Adds a [Part](/docs/api-reference/uploads/part-object) to an [Upload](/docs/api-reference/uploads/object) object. A Part represents a chunk of bytes from the file you are trying to upload. 

Each Part can be at most 64 MB, and you can add Parts until you hit the Upload maximum of 8 GB.

It is possible to add multiple Parts in parallel. You can decide the intended order of the Parts when you [complete the Upload](/docs/api-reference/uploads/complete).

- `listVectorStores` — Returns a list of vector stores.
- `createVectorStore` — Create a vector store.
- `getVectorStore` — Retrieves a vector store.
- `modifyVectorStore` — Modifies a vector store.
- `deleteVectorStore` — Delete a vector store.
- `createVectorStoreFileBatch` — Create a vector store file batch.
- `getVectorStoreFileBatch` — Retrieves a vector store file batch.
- `cancelVectorStoreFileBatch` — Cancel a vector store file batch. This attempts to cancel the processing of files in this batch as soon as possible.
- `listFilesInVectorStoreBatch` — Returns a list of vector store files in a batch.
- `listVectorStoreFiles` — Returns a list of vector store files.
- `createVectorStoreFile` — Create a vector store file by attaching a [File](/docs/api-reference/files) to a [vector store](/docs/api-reference/vector-stores/object).
- `getVectorStoreFile` — Retrieves a vector store file.
- `updateVectorStoreFileAttributes` — Update attributes on a vector store file.
- `deleteVectorStoreFile` — Delete a vector store file. This will remove the file from the vector store but the file itself will not be deleted. To delete the file, use the [delete file](/docs/api-reference/files/delete) endpoint.
- `retrieveVectorStoreFileContent` — Retrieve the parsed contents of a vector store file.
- `searchVectorStore` — Search a vector store for relevant chunks based on a query and file attributes filter.
- `createConversation` — Create a conversation.
- `getConversation` — Get a conversation
- `updateConversation` — Update a conversation
- `deleteConversation` — Delete a conversation. Items in the conversation will not be deleted.
- `ListVideos` — List recently generated videos for the current project.
- `createVideo` — Create a new video generation job from a prompt and optional reference assets.
- `CreateVideoCharacter` — Create a character from an uploaded video.
- `GetVideoCharacter` — Fetch a character.
- `CreateVideoEdit` — Create a new video generation job by editing a source video or existing generated video.
- `CreateVideoExtend` — Create an extension of a completed video.
- `GetVideo` — Fetch the latest metadata for a generated video.
- `DeleteVideo` — Permanently delete a completed or failed video and its stored assets.
- `RetrieveVideoContent` — Download the generated video bytes or a derived preview asset.

Streams the rendered video content for the specified video job.
- `CreateVideoRemix` — Create a remix of a completed video using a refreshed prompt.
- `Getinputtokencounts` — Returns input token counts of the request.

Returns an object with `object` set to `response.input_tokens` and an `input_tokens` count.
- `Compactconversation` — Compact a conversation. Returns a compacted response object.

Learn when and how to compact long-running conversations in the [conversation state guide](/docs/guides/conversation-state#managing-the-context-window). For ZDR-compatible compaction details, see [Compaction (advanced)](/docs/guides/conversation-state#compaction-advanced).
- `ListSkills` — List all skills for the current project.
- `CreateSkill` — Create a new skill.
- `GetSkill` — Get a skill by its ID.
- `UpdateSkillDefaultVersion` — Update the default version pointer for a skill.
- `DeleteSkill` — Delete a skill by its ID.
- `GetSkillContent` — Download a skill zip bundle by its ID.
- `ListSkillVersions` — List skill versions for a skill.
- `CreateSkillVersion` — Create a new immutable skill version.
- `GetSkillVersion` — Get a specific skill version.
- `DeleteSkillVersion` — Delete a skill version.
- `GetSkillVersionContent` — Download a skill version zip bundle.
- `CancelChatSessionMethod` — Cancel an active ChatKit session and return its most recent metadata.

Cancelling prevents new requests from using the issued client secret.
- `CreateChatSessionMethod` — Create a ChatKit session.
- `ListThreadItemsMethod` — List items that belong to a ChatKit thread.
- `GetThreadMethod` — Retrieve a ChatKit thread by its identifier.
- `DeleteThreadMethod` — Delete a ChatKit thread along with its items and stored attachments.
- `ListThreadsMethod` — List ChatKit threads with optional pagination and user filters.

## Setup

```bash
npm install
npm run build
# Register in ~/.claude.json or project .claude.json (see below)
```

## .claude.json registration

```json
{
  "mcpServers": {
    "openai-mcp": {
      "command": "node",
      "args": [
        "dist/index.js"
      ],
      "env": {
        "API_KEY": "<your-api-key>"
      }
    }
  }
}
```

## Auth

Set `API_KEY` (env var for stdio, `wrangler secret` for http) to your upstream API token.

## Re-generate

```bash
node ~/.claude/plugins/heymegabyte-claude-skills/bin/forge-skill-from-openapi.mjs \
  <spec-url> <output-dir> --name openai-mcp --target mcp-server --transport stdio
```
