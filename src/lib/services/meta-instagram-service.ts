import db from "@/lib/db";
import { recordAuditLog } from "./audit-log-service";

export interface PublishResult {
  success: boolean;
  mediaId?: string;
  permalink?: string;
  error?: string;
  isMock: boolean;
}

export class MetaInstagramService {
  private static graphVersion = process.env.META_GRAPH_VERSION || "v21.0";
  private static baseUrl = `https://graph.facebook.com/${MetaInstagramService.graphVersion}`;

  // Check if live Meta credentials are fully configured and non-placeholder
  public static isCredentialsConfigured(): boolean {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
    return !!(
      token &&
      accountId &&
      !token.startsWith("your_") &&
      !accountId.startsWith("your_") &&
      token.length > 20
    );
  }

  // Sleep utility for polling
  private static sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Health check for Meta connection
  public static async checkConnectionHealth(): Promise<{
    connected: boolean;
    isMock: boolean;
    username?: string;
    accountId?: string;
    tokenExpiresAt?: string;
    permissions?: string[];
    error?: string;
  }> {
    const isLive = this.isCredentialsConfigured();

    if (!isLive) {
      const mockAcc = await db.instagramAccount.findFirst({
        where: { isMockMode: true },
        include: { tokenMetadata: true },
      });
      return {
        connected: true,
        isMock: true,
        username: mockAcc?.username || "_unfiltered_lore_",
        accountId: mockAcc?.igUserId || "mock_17841400293849201",
        tokenExpiresAt: mockAcc?.tokenMetadata?.expiresAt?.toISOString(),
        permissions: (mockAcc?.tokenMetadata?.scopes || "").split(","),
      };
    }

    const token = process.env.INSTAGRAM_ACCESS_TOKEN!;
    const accountId = process.env.INSTAGRAM_ACCOUNT_ID!;

    try {
      const url = `${this.baseUrl}/${accountId}?fields=id,username,name,profile_picture_url,followers_count,media_count&access_token=${token}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.error) {
        return {
          connected: false,
          isMock: false,
          error: data.error.message || JSON.stringify(data.error),
        };
      }

      // Update in database
      await db.instagramAccount.upsert({
        where: { igUserId: data.id },
        update: {
          username: data.username,
          accountName: data.name,
          profilePictureUrl: data.profile_picture_url,
          followerCount: data.followers_count || 0,
          mediaCount: data.media_count || 0,
          status: "CONNECTED",
          lastSyncAt: new Date(),
        },
        create: {
          igUserId: data.id,
          username: data.username,
          accountName: data.name,
          profilePictureUrl: data.profile_picture_url,
          followerCount: data.followers_count || 0,
          mediaCount: data.media_count || 0,
          status: "CONNECTED",
          isMockMode: false,
        },
      });

      return {
        connected: true,
        isMock: false,
        username: data.username,
        accountId: data.id,
      };
    } catch (err: any) {
      return {
        connected: false,
        isMock: false,
        error: err.message,
      };
    }
  }

  // Poll media container until status is FINISHED or ERROR
  private static async pollContainerStatus(containerId: string, accessToken: string): Promise<boolean> {
    for (let attempt = 0; attempt < 15; attempt++) {
      await this.sleep(2500);
      const statusUrl = `${this.baseUrl}/${containerId}?fields=status_code&access_token=${accessToken}`;
      const res = await fetch(statusUrl);
      const data = await res.json();

      if (data.status_code === "FINISHED" || !data.status_code) {
        return true;
      } else if (data.status_code === "ERROR") {
        throw new Error(`Meta media container processing failed: ${JSON.stringify(data)}`);
      }
    }
    return true;
  }

  // Publish a single image post to Instagram Feed
  public static async publishSingleImage(params: {
    imageUrl: string;
    caption: string;
    postId?: string;
  }): Promise<PublishResult> {
    // Check if live Meta credentials exist
    if (!this.isCredentialsConfigured()) {
      const mockMediaId = `mock_ig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      console.log(`[MetaInstagramService] DEMO/MOCK PUBLISH triggered for: ${params.imageUrl}`);

      recordAuditLog({
        action: "INSTAGRAM_POST_MOCK_PUBLISHED",
        category: "PUBLISH",
        details: `Simulated post creation in DEMO/MOCK mode. Mock Media ID: ${mockMediaId}. No real IG credentials configured.`,
        severity: "INFO",
      });

      return {
        success: true,
        mediaId: mockMediaId,
        permalink: `https://instagram.com/p/${mockMediaId}`,
        isMock: true,
      };
    }

    const token = process.env.INSTAGRAM_ACCESS_TOKEN!;
    const accountId = process.env.INSTAGRAM_ACCOUNT_ID!;

    try {
      // 1. Create Media Container
      const createUrl = `${this.baseUrl}/${accountId}/media?image_url=${encodeURIComponent(
        params.imageUrl
      )}&caption=${encodeURIComponent(params.caption)}&access_token=${token}`;

      const createRes = await fetch(createUrl, { method: "POST" });
      const createData = await createRes.json();

      if (createData.error) {
        throw new Error(createData.error.message || JSON.stringify(createData.error));
      }
      const containerId = createData.id;

      // 2. Poll for container readiness
      await this.pollContainerStatus(containerId, token);

      // 3. Publish Container
      const pubUrl = `${this.baseUrl}/${accountId}/media_publish?creation_id=${containerId}&access_token=${token}`;
      const pubRes = await fetch(pubUrl, { method: "POST" });
      const pubData = await pubRes.json();

      if (pubData.error) {
        throw new Error(pubData.error.message || JSON.stringify(pubData.error));
      }

      const mediaId = pubData.id;

      recordAuditLog({
        action: "INSTAGRAM_POST_PUBLISHED_REAL",
        category: "PUBLISH",
        details: `Successfully published post to Instagram Feed. Media ID: ${mediaId}`,
        severity: "INFO",
      });

      return {
        success: true,
        mediaId,
        permalink: `https://instagram.com/p/${mediaId}`,
        isMock: false,
      };
    } catch (err: any) {
      console.error("[MetaInstagramService] Publishing error:", err);
      recordAuditLog({
        action: "INSTAGRAM_PUBLISH_FAILED",
        category: "PUBLISH",
        details: `Failed to publish post: ${err.message}`,
        severity: "ERROR",
      });
      return {
        success: false,
        error: err.message,
        isMock: false,
      };
    }
  }

  // Publish a multi-slide carousel to Instagram Feed
  public static async publishCarousel(params: {
    imageUrls: string[];
    caption: string;
    postId?: string;
  }): Promise<PublishResult> {
    if (!this.isCredentialsConfigured()) {
      const mockMediaId = `mock_carousel_${Date.now()}`;
      console.log(`[MetaInstagramService] DEMO/MOCK CAROUSEL PUBLISH for ${params.imageUrls.length} slides.`);

      recordAuditLog({
        action: "INSTAGRAM_CAROUSEL_MOCK_PUBLISHED",
        category: "PUBLISH",
        details: `Simulated carousel publication (${params.imageUrls.length} slides) in DEMO/MOCK mode.`,
        severity: "INFO",
      });

      return {
        success: true,
        mediaId: mockMediaId,
        permalink: `https://instagram.com/p/${mockMediaId}`,
        isMock: true,
      };
    }

    const token = process.env.INSTAGRAM_ACCESS_TOKEN!;
    const accountId = process.env.INSTAGRAM_ACCOUNT_ID!;

    try {
      if (params.imageUrls.length < 2) {
        throw new Error("Instagram Carousels require at least 2 image items.");
      }

      // 1. Create Child Containers
      const childIds: string[] = [];
      for (const url of params.imageUrls) {
        const childUrl = `${this.baseUrl}/${accountId}/media?image_url=${encodeURIComponent(
          url
        )}&is_carousel_item=true&access_token=${token}`;
        const childRes = await fetch(childUrl, { method: "POST" });
        const childData = await childRes.json();
        if (childData.error) {
          throw new Error(`Child container error: ${childData.error.message}`);
        }
        childIds.push(childData.id);
        await this.sleep(1500);
      }

      // 2. Create Parent Container
      const parentUrl = `${this.baseUrl}/${accountId}/media?media_type=CAROUSEL&children=${childIds.join(
        ","
      )}&caption=${encodeURIComponent(params.caption)}&access_token=${token}`;
      const parentRes = await fetch(parentUrl, { method: "POST" });
      const parentData = await parentRes.json();
      if (parentData.error) {
        throw new Error(`Parent carousel container error: ${parentData.error.message}`);
      }
      const containerId = parentData.id;

      // 3. Poll Parent Container
      await this.pollContainerStatus(containerId, token);

      // 4. Publish Parent Container
      const pubUrl = `${this.baseUrl}/${accountId}/media_publish?creation_id=${containerId}&access_token=${token}`;
      const pubRes = await fetch(pubUrl, { method: "POST" });
      const pubData = await pubRes.json();
      if (pubData.error) {
        throw new Error(pubData.error.message || JSON.stringify(pubData.error));
      }

      const mediaId = pubData.id;
      return {
        success: true,
        mediaId,
        permalink: `https://instagram.com/p/${mediaId}`,
        isMock: false,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        isMock: false,
      };
    }
  }

  // Fetch real-time insights from Meta Graph API for a published post
  public static async syncPostInsights(igMediaId: string): Promise<{
    reach: number;
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
    saved: number;
  }> {
    if (!this.isCredentialsConfigured() || igMediaId.startsWith("mock_")) {
      // In mock/demo mode return realistic simulated metrics
      return {
        reach: Math.floor(10000 + Math.random() * 5000),
        impressions: Math.floor(14000 + Math.random() * 7000),
        likes: Math.floor(1200 + Math.random() * 800),
        comments: Math.floor(180 + Math.random() * 120),
        shares: Math.floor(400 + Math.random() * 300),
        saved: Math.floor(350 + Math.random() * 200),
      };
    }

    const token = process.env.INSTAGRAM_ACCESS_TOKEN!;
    try {
      const url = `${this.baseUrl}/${igMediaId}/insights?metric=reach,impressions,saved,likes,comments,shares&access_token=${token}`;
      const res = await fetch(url);
      const data = await res.json();

      let reach = 0;
      let impressions = 0;
      let saved = 0;
      let likes = 0;
      let comments = 0;
      let shares = 0;

      if (data.data && Array.isArray(data.data)) {
        for (const item of data.data) {
          const val = item.values?.[0]?.value || 0;
          if (item.name === "reach") reach = val;
          if (item.name === "impressions") impressions = val;
          if (item.name === "saved") saved = val;
          if (item.name === "likes") likes = val;
          if (item.name === "comments") comments = val;
          if (item.name === "shares") shares = val;
        }
      }

      return { reach, impressions, likes, comments, shares, saved };
    } catch (err) {
      console.error("[MetaInstagramService] Error syncing post insights:", err);
      throw err;
    }
  }
}
