import { z } from 'zod';
import { FoundryClient } from '../foundry-client.js';
import { Logger } from '../logger.js';
import { ErrorHandler } from '../utils/error-handler.js';

export interface ActorCreationToolsOptions {
  foundryClient: FoundryClient;
  logger: Logger;
}


export class ActorCreationTools {
  private foundryClient: FoundryClient;
  private logger: Logger;
  private errorHandler: ErrorHandler;

  constructor({ foundryClient, logger }: ActorCreationToolsOptions) {
    this.foundryClient = foundryClient;
    this.logger = logger.child({ component: 'ActorCreationTools' });
    this.errorHandler = new ErrorHandler(this.logger);
  }

  /**
   * Tool definitions for actor creation operations
   */
  getToolDefinitions() {
    return [
      {
        name: 'create-actor-from-compendium',
        description: 'Create one or more actors from a specific compendium entry with custom names. Use search-compendium first to find the exact creature you want, then use this tool with the packId and itemId from the search results.',
        inputSchema: {
          type: 'object',
          properties: {
            packId: {
              type: 'string',
              description: 'ID of the compendium pack containing the creature (e.g., "dnd5e.monsters")',
            },
            itemId: {
              type: 'string', 
              description: 'ID of the specific creature entry within the pack (get this from search-compendium results)',
            },
            names: {
              type: 'array',
              items: { type: 'string' },
              description: 'Custom names for the created actors (e.g., ["Flameheart", "Sneak", "Peek"])',
              minItems: 1,
            },
            quantity: {
              type: 'number',
              description: 'Number of actors to create (default: based on names array length)',
              minimum: 1,
              maximum: 10,
            },
            addToScene: {
              type: 'boolean',
              description: 'Whether to add created actors to the current scene as tokens',
              default: false,
            },
            placement: {
              type: 'object',
              description: 'Token placement options (only used when addToScene is true)',
              properties: {
                type: {
                  type: 'string',
                  enum: ['random', 'grid', 'center', 'coordinates'],
                  description: 'Placement strategy',
                  default: 'grid',
                },
                coordinates: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      x: { type: 'number', description: 'X coordinate in pixels' },
                      y: { type: 'number', description: 'Y coordinate in pixels' },
                    },
                    required: ['x', 'y'],
                  },
                  description: 'Specific coordinates for each token (required when type is "coordinates")',
                },
              },
              required: ['type'],
            },
          },
          required: ['packId', 'itemId', 'names'],
        },
      },
      {
        name: 'get-compendium-entry-full',
        description: 'Retrieve complete stat block data including items, spells, and abilities for actor creation',
        inputSchema: {
          type: 'object',
          properties: {
            packId: {
              type: 'string',
              description: 'Compendium pack identifier',
            },
            entryId: {
              type: 'string',
              description: 'Entry identifier within the pack',
            },
          },
          required: ['packId', 'entryId'],
        },
      },
      {
        name: 'list-actor-folders',
        description: 'List all Actor folders with their IDs, names, colors, and parent/child relationships. Use this before create-actor-folder or create-actor to avoid duplicates and get the correct folder ID.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'create-actor-folder',
        description: 'Create a folder in the Actors directory to organise NPCs. Returns the folder ID for use in create-actor.',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the folder to create',
            },
            description: {
              type: 'string',
              description: 'Optional description for the folder',
            },
            color: {
              type: 'string',
              description: 'Optional hex color for the folder (e.g. "#4a90e2")',
            },
            parentFolder: {
              type: 'string',
              description: 'Optional name or ID of an existing Actor folder to nest this folder inside',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'create-actor',
        description: 'Create a new NPC actor from scratch without a compendium source. Supports common D&D 5e fields as shortcuts; use systemData for other game systems or advanced overrides.',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the actor',
            },
            type: {
              type: 'string',
              enum: ['npc', 'character'],
              description: 'Actor type (default: "npc")',
              default: 'npc',
            },
            folder: {
              type: 'string',
              description: 'Name or ID of the Actor folder to place the actor in',
            },
            img: {
              type: 'string',
              description: 'Image path or URL for the actor portrait',
            },
            biography: {
              type: 'string',
              description: 'Biography or description as HTML (maps to system.details.biography.value in D&D 5e)',
            },
            hp: {
              type: 'object',
              description: 'Hit point values (D&D 5e)',
              properties: {
                value: { type: 'number', description: 'Current HP' },
                max: { type: 'number', description: 'Maximum HP' },
              },
            },
            ac: {
              type: 'number',
              description: 'Armour Class as a flat value (D&D 5e)',
            },
            abilities: {
              type: 'object',
              description: 'Ability scores (D&D 5e)',
              properties: {
                str: { type: 'number' },
                dex: { type: 'number' },
                con: { type: 'number' },
                int: { type: 'number' },
                wis: { type: 'number' },
                cha: { type: 'number' },
              },
            },
            cr: {
              type: 'number',
              description: 'Challenge Rating (D&D 5e)',
            },
            size: {
              type: 'string',
              description: 'Creature size: "tiny", "sm", "med", "lg", "huge", or "grg" (D&D 5e)',
            },
            alignment: {
              type: 'string',
              description: 'Alignment string, e.g. "Chaotic Evil" (D&D 5e)',
            },
            creatureType: {
              type: 'string',
              description: 'Creature type, e.g. "humanoid", "undead", "beast" (D&D 5e)',
            },
            speed: {
              type: 'number',
              description: 'Walking speed in feet (D&D 5e)',
            },
            addToScene: {
              type: 'boolean',
              description: 'Whether to place the actor as a token on the current scene',
              default: false,
            },
            placement: {
              type: 'object',
              description: 'Token placement options (only when addToScene is true)',
              properties: {
                type: {
                  type: 'string',
                  enum: ['random', 'grid', 'center', 'coordinates'],
                  default: 'grid',
                },
                coordinates: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      x: { type: 'number' },
                      y: { type: 'number' },
                    },
                    required: ['x', 'y'],
                  },
                },
              },
              required: ['type'],
            },
            systemData: {
              type: 'object',
              description: 'Raw system data to merge into the actor (for non-D&D5e systems or advanced overrides)',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'update-actor',
        description: 'Update an existing actor by ID or name. Supports the same convenience fields as create-actor. Use systemData for raw system field patches.',
        inputSchema: {
          type: 'object',
          properties: {
            actorId: {
              type: 'string',
              description: 'Foundry actor ID (preferred)',
            },
            actorName: {
              type: 'string',
              description: 'Actor name to search for (used if actorId is not provided)',
            },
            name: {
              type: 'string',
              description: 'New name for the actor',
            },
            folder: {
              type: 'string',
              description: 'Name or ID of an Actor folder to move the actor into',
            },
            img: {
              type: 'string',
              description: 'New portrait image path or URL',
            },
            biography: {
              type: 'string',
              description: 'Updated biography HTML',
            },
            hp: {
              type: 'object',
              description: 'HP update',
              properties: {
                value: { type: 'number' },
                max: { type: 'number' },
              },
            },
            ac: {
              type: 'number',
              description: 'New flat Armour Class value (D&D 5e)',
            },
            abilities: {
              type: 'object',
              description: 'Ability scores to update (D&D 5e)',
              properties: {
                str: { type: 'number' },
                dex: { type: 'number' },
                con: { type: 'number' },
                int: { type: 'number' },
                wis: { type: 'number' },
                cha: { type: 'number' },
              },
            },
            cr: {
              type: 'number',
              description: 'Challenge Rating (D&D 5e)',
            },
            size: {
              type: 'string',
              description: 'Creature size: "tiny", "sm", "med", "lg", "huge", or "grg"',
            },
            alignment: {
              type: 'string',
              description: 'Alignment string (D&D 5e)',
            },
            creatureType: {
              type: 'string',
              description: 'Creature type, e.g. "humanoid", "undead" (D&D 5e)',
            },
            speed: {
              type: 'number',
              description: 'Walking speed in feet (D&D 5e)',
            },
            systemData: {
              type: 'object',
              description: 'Raw system data fields to patch (dot-notation keys are supported)',
            },
          },
          oneOf: [
            { required: ['actorId'] },
            { required: ['actorName'] },
          ],
        },
      },
    ];
  }

  /**
   * Handle actor creation from specific compendium entry
   */
  async handleCreateActorFromCompendium(args: any): Promise<any> {
    const schema = z.object({
      packId: z.string().min(1, 'Pack ID cannot be empty'),
      itemId: z.string().min(1, 'Item ID cannot be empty'),
      names: z.array(z.string().min(1)).min(1, 'At least one name is required'),
      quantity: z.number().min(1).max(10).optional(),
      addToScene: z.boolean().default(false),
      placement: z.object({
        type: z.enum(['random', 'grid', 'center', 'coordinates']).default('grid'),
        coordinates: z.array(z.object({
          x: z.number(),
          y: z.number(),
        })).optional(),
      }).optional(),
    });

    const { packId, itemId, names, quantity, addToScene, placement } = schema.parse(args);
    const finalQuantity = quantity || names.length;

    this.logger.info('Creating actors from specific compendium entry', {
      packId,
      itemId,
      names,
      quantity: finalQuantity,
      addToScene,
    });

    try {
      // Ensure we have enough names for the quantity
      const customNames = [...names];
      while (customNames.length < finalQuantity) {
        const baseName = names[0] || 'Unnamed';
        customNames.push(`${baseName} ${customNames.length + 1}`);
      }

      // Create the actors via Foundry module using exact pack/item IDs
      const result = await this.foundryClient.query('foundry-mcp-bridge.createActorFromCompendium', {
        packId,
        itemId,
        customNames: customNames.slice(0, finalQuantity),
        quantity: finalQuantity,
        addToScene,
        placement: placement ? {
          type: placement.type,
          coordinates: placement.coordinates,
        } : undefined,
      });

      this.logger.info('Actor creation completed', {
        totalCreated: result.totalCreated,
        totalRequested: result.totalRequested,
        tokensPlaced: result.tokensPlaced || 0,
        hasErrors: !!result.errors,
      });

      // Format response for Claude
      return this.formatSimpleActorCreationResponse(result, packId, itemId, customNames.slice(0, finalQuantity));

    } catch (error) {
      this.errorHandler.handleToolError(error, 'create-actor-from-compendium', 'actor creation');
    }
  }

  /**
   * Handle getting full compendium entry data
   */
  async handleGetCompendiumEntryFull(args: any): Promise<any> {
    const schema = z.object({
      packId: z.string().min(1, 'Pack ID cannot be empty'),
      entryId: z.string().min(1, 'Entry ID cannot be empty'),
    });

    const { packId, entryId } = schema.parse(args);

    this.logger.info('Getting full compendium entry', { packId, entryId });

    try {
      const fullEntry = await this.foundryClient.query('foundry-mcp-bridge.getCompendiumDocumentFull', {
        packId,
        documentId: entryId,
      });

      this.logger.debug('Successfully retrieved full compendium entry', {
        packId,
        entryId,
        name: fullEntry.name,
        hasItems: !!fullEntry.items?.length,
        hasEffects: !!fullEntry.effects?.length,
      });

      return this.formatCompendiumEntryResponse(fullEntry);

    } catch (error) {
      this.errorHandler.handleToolError(error, 'get-compendium-entry-full', 'compendium retrieval');
    }
  }








  async handleListActorFolders(_args: any): Promise<any> {
    this.logger.info('Listing actor folders');
    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.listActorFolders', {});
      const lines = result.folders.map((f: any) => {
        const indent = '  '.repeat(f.depth || 0);
        return `${indent}• ${f.name} (ID: ${f.id})${f.color ? ` [${f.color}]` : ''}`;
      });
      return {
        folders: result.folders,
        message: result.folders.length === 0
          ? 'No Actor folders found.'
          : `Actor folders:\n${lines.join('\n')}`,
      };
    } catch (error) {
      this.errorHandler.handleToolError(error, 'list-actor-folders', 'folder listing');
    }
  }

  async handleCreateActorFolder(args: any): Promise<any> {
    const schema = z.object({
      name: z.string().min(1, 'Folder name cannot be empty'),
      description: z.string().optional(),
      color: z.string().optional(),
      parentFolder: z.string().optional(),
    });

    const { name, description, color, parentFolder } = schema.parse(args);

    this.logger.info('Creating actor folder', { name, parentFolder });

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.createActorFolder', {
        name,
        description,
        color,
        parentFolder,
      });

      const status = result.alreadyExisted ? 'already existed' : 'created';
      return {
        success: result.success,
        id: result.id,
        name: result.name,
        message: `Folder "${result.name}" ${status} (ID: ${result.id})`,
      };
    } catch (error) {
      this.errorHandler.handleToolError(error, 'create-actor-folder', 'folder creation');
    }
  }

  async handleCreateActor(args: any): Promise<any> {
    const schema = z.object({
      name: z.string().min(1, 'Actor name cannot be empty'),
      type: z.enum(['npc', 'character']).default('npc'),
      folder: z.string().optional(),
      img: z.string().optional(),
      biography: z.string().optional(),
      hp: z.object({
        value: z.number().optional(),
        max: z.number().optional(),
      }).optional(),
      ac: z.number().optional(),
      abilities: z.object({
        str: z.number().optional(),
        dex: z.number().optional(),
        con: z.number().optional(),
        int: z.number().optional(),
        wis: z.number().optional(),
        cha: z.number().optional(),
      }).optional(),
      cr: z.number().optional(),
      size: z.string().optional(),
      alignment: z.string().optional(),
      creatureType: z.string().optional(),
      speed: z.number().optional(),
      addToScene: z.boolean().default(false),
      placement: z.object({
        type: z.enum(['random', 'grid', 'center', 'coordinates']).default('grid'),
        coordinates: z.array(z.object({ x: z.number(), y: z.number() })).optional(),
      }).optional(),
      systemData: z.record(z.unknown()).optional(),
    });

    const params = schema.parse(args);

    this.logger.info('Creating actor from scratch', { name: params.name, type: params.type });

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.createActor', params);

      const sceneInfo = result.tokensPlaced > 0
        ? `\nAdded token to the current scene.`
        : '';

      return {
        success: result.success,
        id: result.id,
        name: result.name,
        message: `Created actor "${result.name}" (ID: ${result.id})${sceneInfo}`,
      };
    } catch (error) {
      this.errorHandler.handleToolError(error, 'create-actor', 'actor creation');
    }
  }

  async handleUpdateActor(args: any): Promise<any> {
    const schema = z.object({
      actorId: z.string().optional(),
      actorName: z.string().optional(),
      name: z.string().optional(),
      folder: z.string().optional(),
      img: z.string().optional(),
      biography: z.string().optional(),
      hp: z.object({
        value: z.number().optional(),
        max: z.number().optional(),
      }).optional(),
      ac: z.number().optional(),
      abilities: z.object({
        str: z.number().optional(),
        dex: z.number().optional(),
        con: z.number().optional(),
        int: z.number().optional(),
        wis: z.number().optional(),
        cha: z.number().optional(),
      }).optional(),
      cr: z.number().optional(),
      size: z.string().optional(),
      alignment: z.string().optional(),
      creatureType: z.string().optional(),
      speed: z.number().optional(),
      systemData: z.record(z.unknown()).optional(),
    }).refine(d => d.actorId || d.actorName, { message: 'Either actorId or actorName is required' });

    const params = schema.parse(args);

    this.logger.info('Updating actor', { actorId: params.actorId, actorName: params.actorName });

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.updateActor', params);

      return {
        success: result.success,
        id: result.id,
        name: result.name,
        updatedFields: result.updatedFields,
        message: `Updated actor "${result.name}" (ID: ${result.id}). Fields changed: ${result.updatedFields?.join(', ') || 'none'}`,
      };
    } catch (error) {
      this.errorHandler.handleToolError(error, 'update-actor', 'actor update');
    }
  }

  /**
   * Format compendium entry response
   */
  private formatCompendiumEntryResponse(entry: any): any {
    const itemsInfo = entry.items?.length > 0 
      ? `\n📦 Items: ${entry.items.map((item: any) => item.name).join(', ')}`
      : '';
    
    const effectsInfo = entry.effects?.length > 0
      ? `\n✨ Effects: ${entry.effects.map((effect: any) => effect.name).join(', ')}`
      : '';

    return {
      name: entry.name,
      type: entry.type,
      pack: entry.packLabel,
      system: entry.system,
      fullData: entry.fullData,
      items: entry.items || [],
      effects: entry.effects || [],
      summary: `📊 **${entry.name}** (${entry.type} from ${entry.packLabel})${itemsInfo}${effectsInfo}`,
    };
  }

  /**
   * Format simplified actor creation response
   */
  private formatSimpleActorCreationResponse(result: any, packId: string, itemId: string, customNames: string[]): any {
    const summary = `✅ Created ${result.totalCreated} of ${result.totalRequested} requested actors`;
    
    const details = result.actors.map((actor: any) => 
      `• **${actor.name}** (from ${packId})`
    ).join('\n');

    const sceneInfo = result.tokensPlaced > 0 
      ? `\n🎯 Added ${result.tokensPlaced} tokens to the current scene`
      : '';

    const errorInfo = result.errors?.length > 0
      ? `\n⚠️ Issues: ${result.errors.join(', ')}`
      : '';

    return {
      summary,
      success: result.success,
      details: {
        actors: result.actors,
        sourceEntry: {
          packId,
          itemId,
        },
        tokensPlaced: result.tokensPlaced || 0,
        errors: result.errors,
      },
      message: summary + '\n\n' + details + sceneInfo + errorInfo,
    };
  }
}