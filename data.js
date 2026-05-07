const DATA = {
  systemDesign: [
    {
      id: 'url-shortener',
      title: 'Design a URL Shortener',
      subtitle: 'Like Bit.ly or TinyURL',
      difficulty: 'Medium',
      companies: ['Amazon', 'Google', 'Microsoft', 'Twitter', 'Adobe', 'Uber'],
      tags: ['Hashing', 'Database Design', 'Caching', 'Scalability', 'Key-Value Store'],
      overview: 'A URL shortener converts long URLs into short, memorable links. When a user visits the short link, they are redirected to the original URL. The system must handle billions of URLs and millions of redirects per day.',
      expectedQuestions: [
        'How do you generate a unique short URL?',
        'How do you handle 100 million URLs?',
        'How do you scale to 10,000 requests/second?',
        'How do you support custom aliases (vanity URLs)?',
        'What is the difference between 301 and 302 redirects here?',
        'How do you track click analytics?',
        'How do you prevent abuse and spam?',
      ],
      keyComponents: [
        { name: 'API Layer', description: 'POST /shorten accepts long URL, returns short code. GET /:code performs redirect. Rate limiting applied here.' },
        { name: 'ID Generator', description: 'Base62 encoding (a-z, A-Z, 0-9) of an auto-increment counter. 6 characters = 62^6 = 56 billion unique URLs.' },
        { name: 'Database', description: 'NoSQL key-value store (DynamoDB/Cassandra) mapping short code → long URL. Schema: {code, originalUrl, userId, createdAt, expiresAt}.' },
        { name: 'Cache Layer', description: 'Redis caches top 20% of URLs that get 80% of traffic. LRU eviction. TTL matches URL expiry.' },
        { name: 'Redirect Service', description: '302 (temporary) redirect forces every request through the server for analytics tracking. 301 (permanent) lets browsers cache — better performance but no analytics.' },
        { name: 'Analytics Pipeline', description: 'Click events published to Kafka asynchronously. Consumer aggregates clicks, location, device data into ClickHouse for dashboards.' },
      ],
      designSteps: [
        'Clarify requirements: read-heavy (100:1 read/write ratio), analytics needed, custom URLs, expiry support.',
        'Capacity: 100M new URLs/day = 1,157 writes/sec. With 100:1 ratio = 115,700 reads/sec.',
        'Encoding: 6-char Base62 = 56B combinations. Use Zookeeper to distribute counter ranges to app servers, avoiding collisions.',
        'Schema: {shortCode PK, originalUrl, userId, createdAt, expiresAt}. Index on shortCode.',
        'Cache: Redis cluster with shortCode → originalUrl mapping. Evict on expiry. Pre-warm popular URLs.',
        'Collision handling: check if short code exists before inserting. Retry with incremented counter.',
        'Analytics: Publish click events to Kafka. Consumer batch-aggregates into analytics DB.',
        'Cleanup: Background job scans expired URLs and purges from DB and cache.',
      ],
      tradeoffs: [
        { aspect: 'Hash vs Counter', pro: 'Counter: guaranteed unique, predictable', con: 'Counter: single point of failure without distributed coordination (Zookeeper)' },
        { aspect: '301 vs 302 Redirect', pro: '302: analytics on every click, flexible expiry', con: '302: more server load; 301 offloads to browser cache' },
        { aspect: 'SQL vs NoSQL', pro: 'NoSQL: horizontal scaling, high write throughput', con: 'NoSQL: eventual consistency, no complex joins' },
      ],
      followUps: [
        'How would you implement URL expiration and cleanup?',
        'How would you prevent the same long URL from getting multiple short codes?',
        'How would you support private/password-protected URLs?',
        'Design the analytics dashboard — what queries would you optimize for?',
      ],
    },
    {
      id: 'twitter-feed',
      title: 'Design Twitter / News Feed',
      subtitle: 'Social media feed with follows, tweets, and timeline',
      difficulty: 'Hard',
      companies: ['Twitter', 'Facebook', 'Instagram', 'LinkedIn', 'Snap'],
      tags: ['Fan-out', 'Cache', 'Timeline', 'Pub-Sub', 'NoSQL'],
      overview: 'Design a scalable social media platform where users post tweets, follow others, and see a personalized feed. The core challenge is the fan-out problem: when a celebrity with millions of followers posts, how do you efficiently update all their feeds?',
      expectedQuestions: [
        'How do you generate the home timeline for a user?',
        'How do you handle celebrities with millions of followers (fan-out problem)?',
        'How do you store and retrieve tweets at scale?',
        'How do you handle real-time feed updates?',
        'How do you implement trending topics?',
        'How do you implement tweet search?',
        'How do you handle deleted tweets already cached in feeds?',
      ],
      keyComponents: [
        { name: 'Tweet Service', description: 'Handles tweet creation and storage. Tweets stored in Cassandra with userId + tweetId (time UUID) as composite key for time-ordered retrieval.' },
        { name: 'User Graph Service', description: 'Manages follower/following relationships. Adjacency list stored in Redis for fast lookups. Graph DB (Neo4j) for recommendation queries.' },
        { name: 'Fan-out Service', description: 'On tweet creation, pushes tweetId to followers\' timeline caches (push model for regular users). Celebrities use pull model — timeline fetched on demand.' },
        { name: 'Timeline Cache', description: 'Redis sorted set per user storing recent 300 tweetIds, scored by timestamp. O(log n) insert and O(1) range retrieval.' },
        { name: 'Media Service', description: 'Images/videos stored in S3. CDN (CloudFront) serves media at edge globally. Thumbnails generated on upload via Lambda.' },
        { name: 'Search Service', description: 'Elasticsearch indexes tweet text for full-text search. Separate Kafka consumer indexes trending topics in real-time.' },
      ],
      designSteps: [
        'Clarify: tweet posting, home timeline, follow/unfollow. Assume 300M DAU, 500M tweets/day.',
        'Tweet storage: Cassandra partition key = userId, clustering key = tweetId (time UUID). Enables efficient "get user\'s tweets" query.',
        'Fan-out strategy: regular users (< 10K followers) → push to all follower timeline caches on tweet. Celebrities → pull on timeline request.',
        'Timeline generation: merge precomputed timeline (regular users) + real-time fetch from celebrities. Sort merged result by timestamp.',
        'Caching: timeline cache = Redis sorted set of last 300 tweetIds. Actual tweet content fetched via tweetIds in bulk.',
        'Real-time: WebSocket for live feed updates. Long polling as fallback for mobile clients.',
        'Deletion: when tweet deleted, remove from tweet store AND async clean from all timeline caches via a cleanup queue.',
      ],
      tradeoffs: [
        { aspect: 'Push vs Pull Fan-out', pro: 'Push: fast reads, timelines precomputed', con: 'Push: massive write amplification for celebrities (Beyoncé problem)' },
        { aspect: 'Cassandra vs MySQL for Tweets', pro: 'Cassandra: write-optimized, scales horizontally', con: 'Cassandra: no joins, limited query flexibility' },
        { aspect: 'Timeline Cache Size', pro: 'Larger: better user experience for heavy scrollers', con: 'Larger: higher memory cost per user' },
      ],
      followUps: [
        'How do you implement "who to follow" recommendations?',
        'How would you design retweet functionality without duplicating storage?',
        'How do you implement tweet notifications (likes, replies, mentions)?',
        'How would you design Twitter Spaces (live audio)?',
      ],
    },
    {
      id: 'netflix',
      title: 'Design Netflix / Video Streaming',
      subtitle: 'Large-scale video streaming platform',
      difficulty: 'Hard',
      companies: ['Netflix', 'YouTube', 'Amazon', 'Hulu', 'Disney+'],
      tags: ['CDN', 'Video Encoding', 'Adaptive Streaming', 'Object Storage', 'Microservices'],
      overview: 'Design a video streaming platform supporting upload, encoding, storage, and streaming of video to millions of concurrent users globally. Key challenges: video encoding pipeline, CDN-based delivery, and adaptive bitrate streaming to handle varying network conditions.',
      expectedQuestions: [
        'How do you handle video upload and transcoding?',
        'How do you deliver video with low latency globally?',
        'What is adaptive bitrate streaming and how does it work?',
        'How do you handle 50 million concurrent viewers?',
        'How do you implement the recommendation system?',
        'How do you ensure smooth playback on different network conditions?',
        'How would you design the download-for-offline feature?',
      ],
      keyComponents: [
        { name: 'Upload Service', description: 'Accepts chunked video uploads (5MB chunks). Stores raw video in S3. Triggers encoding pipeline via SQS message on completion.' },
        { name: 'Encoding Pipeline', description: 'Transcodes video into multiple resolutions (240p → 4K) and formats (H.264, H.265, VP9). Workers pull from SQS. Output: ~18 versions per video.' },
        { name: 'CDN', description: 'Netflix Open Connect CDN. Edge servers in ISP data centers cache popular content. Client requests go to nearest edge. Cache miss → origin S3.' },
        { name: 'Streaming Service', description: 'Returns HLS manifest (m3u8) listing available quality levels and segment URLs. Client ABR algorithm selects quality each segment.' },
        { name: 'Metadata Service', description: 'MySQL for structured browsing (genre, actor, year). Elasticsearch for search. Redis cache for popular titles. S3 for thumbnail images.' },
        { name: 'Recommendation Engine', description: 'Collaborative filtering (what similar users watched) + content-based filtering. Apache Spark for batch model training. Stored recommendations served from Redis.' },
      ],
      designSteps: [
        'Clarify: upload, encoding, streaming. 200M subscribers, peak 50M concurrent streams.',
        'Upload: resumable chunked uploads. Client retries individual failed chunks. Final assembly trigger after all chunks received.',
        'Encoding: async pipeline via SQS. Each job encodes one video into all quality levels. Multiple workers in parallel.',
        'CDN strategy: proactively push popular content to edges. Long-tail content pulled on demand. Cache TTL = video lifetime.',
        'Streaming: HLS with 4-6 second segments. Player downloads 3 segments ahead. Switches quality based on measured throughput.',
        'Metadata: MySQL sharded by contentId. Redis caches title metadata. Elasticsearch for title/actor/genre search.',
        'Monitoring: track buffer ratio, startup latency, bitrate switches per session. Alert ops if quality drops below threshold.',
      ],
      tradeoffs: [
        { aspect: 'HLS vs DASH', pro: 'HLS: native iOS/Safari support, simpler', con: 'DASH: better cross-platform, smaller overhead, open standard' },
        { aspect: 'Push vs Pull CDN', pro: 'Push: instant delivery for popular content', con: 'Push: wastes bandwidth if content unpopular' },
        { aspect: 'Encoding Quality Levels', pro: 'More levels: smooth adaptation on all devices', con: 'More levels: 6x storage and encoding cost' },
      ],
      followUps: [
        'How do you handle DRM (Digital Rights Management)?',
        'How do you implement interactive thumbnails (preview on hover/scrub)?',
        'How do you A/B test thumbnail images to maximize click-through?',
        'How do you handle live streaming vs on-demand differently?',
      ],
    },
    {
      id: 'whatsapp',
      title: 'Design WhatsApp / Chat System',
      subtitle: 'Real-time messaging at scale',
      difficulty: 'Hard',
      companies: ['WhatsApp', 'Facebook', 'Slack', 'Discord', 'Telegram'],
      tags: ['WebSockets', 'Message Queue', 'Consistency', 'Push Notifications', 'Encryption'],
      overview: 'Design a real-time messaging system supporting 1:1 and group chats, delivery status (sent/delivered/read), media sharing, and end-to-end encryption. Core challenges: persistent connections at scale, guaranteed message ordering, and offline delivery.',
      expectedQuestions: [
        'How do you maintain real-time connections for billions of users?',
        'How do you ensure messages are delivered exactly once?',
        'How do you implement sent/delivered/read receipts?',
        'How do you handle group messages at scale?',
        'How do you handle offline users?',
        'How do you implement end-to-end encryption?',
        'How do you store and retrieve chat history efficiently?',
      ],
      keyComponents: [
        { name: 'WebSocket Servers', description: 'Maintain persistent connections per user. Users connect to nearest server via load balancer. Connection state stored in Redis (userId → serverId).' },
        { name: 'Message Service', description: 'Routes messages between users. Assigns sequence numbers for ordering within conversation. Stores in Cassandra partitioned by conversationId.' },
        { name: 'Presence Service', description: 'Tracks online/offline/last-seen. Clients send heartbeat every 30s. Updates Redis TTL. Notifies contacts on status change.' },
        { name: 'Push Notification Service', description: 'When recipient offline, routes through APNs (iOS) or FCM (Android). Retries on failure. Fallback to SMS for critical messages.' },
        { name: 'Media Service', description: 'Client compresses media before upload. Stored in S3. CDN for fast delivery. Generates thumbnails server-side.' },
        { name: 'Message Queue', description: 'Kafka decouples message delivery from storage. Guarantees messages survive spikes. Separate topics per region for latency.' },
      ],
      designSteps: [
        'Clarify: 1:1 and group chats, read receipts, media, 2B users, 100B messages/day.',
        'Connection: each user connects via WebSocket to a connection server. Service discovery maps userId → connection server.',
        'Message flow: Sender → WebSocket → Message Service → Kafka → (online) Recipient WebSocket / (offline) Push Notification.',
        'Storage: Cassandra partition key = conversationId, clustering key = messageId (time UUID). Retrieve last N messages efficiently.',
        'Delivery receipt: ACK to sender when message stored (sent ✓). Delivered (✓✓) when recipient device receives. Read (blue ✓✓) when chat opened.',
        'Group messages: fan-out to all member connection servers. For large groups (> 500), store message once and mark delivery per member.',
        'E2E encryption: Signal Protocol. Keys exchanged during registration. Server stores and routes ciphertext only — cannot read content.',
      ],
      tradeoffs: [
        { aspect: 'WebSocket vs Long Polling', pro: 'WebSocket: true real-time, low overhead', con: 'WebSocket: stateful connections, harder to scale than stateless HTTP' },
        { aspect: 'Cassandra vs MySQL', pro: 'Cassandra: write-optimized, scales horizontally per shard', con: 'Cassandra: limited query patterns, eventual consistency' },
        { aspect: 'Group Fan-out', pro: 'Fan-out on write: fast reads per member', con: 'Fan-out on write: expensive for large groups (> 1000 members)' },
      ],
      followUps: [
        'How would you implement disappearing messages?',
        'How do you handle message ordering when user has multiple devices?',
        'How would you implement message reactions efficiently?',
        'How would you design voice/video calling on top of this?',
      ],
    },
    {
      id: 'uber',
      title: 'Design Uber / Ride Sharing',
      subtitle: 'Location-aware driver matching and routing',
      difficulty: 'Hard',
      companies: ['Uber', 'Lyft', 'Ola', 'Grab', 'DoorDash'],
      tags: ['Geospatial', 'Real-time', 'Matching', 'GPS', 'State Machine'],
      overview: 'Design a ride-sharing platform that matches riders with nearby drivers in real-time, tracks live location, handles surge pricing, and processes payments. Core challenges: efficient geospatial queries, real-time location tracking at scale, and fair matching algorithms.',
      expectedQuestions: [
        'How do you find the nearest available driver?',
        'How do you handle real-time location updates from millions of drivers?',
        'How do you implement surge pricing?',
        'How do you match rider to the optimal driver?',
        'How do you design the trip state machine?',
        'How do you estimate ETA accurately?',
        'How do you handle driver/rider cancellations?',
      ],
      keyComponents: [
        { name: 'Location Service', description: 'Receives GPS updates from driver app every 4 seconds. Stores in Redis GeoSet per city. Enables O(log n) GEORADIUS queries for nearby drivers.' },
        { name: 'Matching Service', description: 'On ride request, queries drivers within 5km radius, ranks by proximity + rating + car type. Sends offer to top N drivers sequentially with 10s timeout each.' },
        { name: 'Trip State Machine', description: 'States: REQUESTED → DRIVER_ASSIGNED → DRIVER_ARRIVING → IN_PROGRESS → COMPLETED/CANCELLED. Each transition logged with timestamp for billing and analytics.' },
        { name: 'Maps & Routing Service', description: 'ETA calculation using Google Maps API or internal routing engine. Pre-computed road graph with historical speed data per road segment by time of day.' },
        { name: 'Surge Pricing Service', description: 'Monitors supply (available drivers) vs demand (pending requests) per GeoHash cell every 60s. Surge multiplier computed and shown to rider before booking.' },
        { name: 'Payment Service', description: 'Calculates fare: base fare + (per-mile rate × distance) + (per-minute rate × time) × surge. Integrates with Stripe. Handles refunds for cancellations.' },
      ],
      designSteps: [
        'Clarify: ride matching, real-time tracking, payments, ratings. 5M rides/day, 1M concurrent drivers.',
        'Location storage: Redis GeoSet per city. GEOADD on driver update. GEORADIUS to find nearby drivers. Expires stale entries after 30s without update.',
        'GeoHash: divide map into hexagonal cells (H3 by Uber). Query driver\'s cell + 6 adjacent cells = ~7km radius search.',
        'Matching: sort candidate drivers by distance. Send offer to closest first, wait 10s, if declined try next. Max 3 attempts.',
        'Trip state: store in PostgreSQL for ACID guarantees. State transitions via REST API with idempotency keys.',
        'Real-time tracking: driver sends location every 4s → Location Service. Rider app polls every 4s or subscribes via WebSocket.',
        'ETA: historical data + real-time traffic. Weight by time of day and day of week per road segment.',
      ],
      tradeoffs: [
        { aspect: 'Redis GeoSet vs PostGIS', pro: 'Redis: in-memory, sub-millisecond queries', con: 'Redis: data loss without persistence, limited to simple geo queries' },
        { aspect: 'Sequential vs Parallel Driver Offer', pro: 'Sequential: no two drivers accept same ride', con: 'Sequential: higher wait time if first drivers decline' },
        { aspect: 'PostgreSQL for Trips', pro: 'ACID guarantees, easy to audit billing', con: 'Requires sharding at scale (shard by rideId or regionId)' },
      ],
      followUps: [
        'How would you implement carpooling (UberPool/shared rides)?',
        'How do you handle GPS spoofing by drivers to inflate fare?',
        'How would you design the driver earnings and payout system?',
        'How do you route notifications efficiently across timezones?',
      ],
    },
    {
      id: 'rate-limiter',
      title: 'Design a Rate Limiter',
      subtitle: 'Control API request frequency per user/IP',
      difficulty: 'Medium',
      companies: ['Stripe', 'AWS', 'Cloudflare', 'Google', 'Twitter', 'Netflix'],
      tags: ['Distributed Systems', 'Redis', 'Token Bucket', 'API Gateway', 'Middleware'],
      overview: 'A rate limiter controls the rate of requests sent to or received by a system. Used to prevent DoS attacks, ensure fair usage, and control costs. Key algorithms: Token Bucket, Leaky Bucket, Fixed Window, Sliding Window Log, and Sliding Window Counter.',
      expectedQuestions: [
        'What are the different rate limiting algorithms?',
        'How do you implement a distributed rate limiter across multiple servers?',
        'Where do you place the rate limiter in the architecture?',
        'How do you handle race conditions in a distributed environment?',
        'What happens when the rate limiter itself fails?',
        'How do you implement different limits for different user tiers?',
        'How do you rate limit by IP vs user ID vs API key?',
      ],
      keyComponents: [
        { name: 'Token Bucket', description: 'N tokens added per second up to bucket capacity. Each request consumes 1 token. Allows controlled bursts. Used by Stripe and AWS.' },
        { name: 'Sliding Window Counter', description: 'More accurate than fixed window. Splits time into small sub-buckets. Weighted count = current_window + (overlap_ratio × previous_window).' },
        { name: 'Redis Counter', description: 'Key = "{userId}:{endpoint}:{minuteWindow}". INCR + TTL = 60s. Lua script makes check-and-increment atomic.' },
        { name: 'Rate Limit Headers', description: 'Return X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset on every response. Return 429 Too Many Requests with Retry-After header when exceeded.' },
        { name: 'Rules Engine', description: 'Configurable limits per tier/endpoint stored in Redis or config service. Example: 100 req/min free, 1000 req/min paid, 10 req/min for /login.' },
        { name: 'Middleware Layer', description: 'Placed at API Gateway (Nginx, AWS API Gateway) or as a middleware in each service. Checks limit before request reaches business logic.' },
      ],
      designSteps: [
        'Choose algorithm: Token Bucket for bursty API traffic (recommended). Sliding Window for smoother limits. Fixed Window for simplicity.',
        'Choose placement: API Gateway (centralized, single enforcement point) vs service-level (more control, more complexity).',
        'Redis implementation: INCR key, check against limit, SET expiry. Atomic via Lua script to prevent TOCTOU race condition.',
        'Lua atomicity: single EVAL call that does GET, compare, INCR, EXPIRE — runs as one Redis command, no race condition.',
        'Multi-server: all servers share same Redis cluster. Single source of truth for counts across fleet.',
        'Graceful degradation: if Redis unavailable, decide: fail open (allow all traffic) vs fail closed (reject all). Configurable per endpoint criticality.',
        'Response: HTTP 429 + Retry-After: {seconds} header + JSON body with limit details.',
      ],
      tradeoffs: [
        { aspect: 'Token Bucket vs Sliding Window', pro: 'Token Bucket: allows bursts, more flexible', con: 'Sliding Window: more accurate but slightly more memory/compute' },
        { aspect: 'Centralized Redis vs Local Counter', pro: 'Centralized: accurate across all servers', con: 'Centralized: Redis becomes critical dependency, latency overhead' },
        { aspect: 'Fail Open vs Fail Closed', pro: 'Fail open: high availability during rate limiter outage', con: 'Fail open: vulnerable to DoS if rate limiter is down during attack' },
      ],
      followUps: [
        'How do you rate limit across a multi-region deployment?',
        'How do you handle legitimate traffic spikes (product launch, viral moment)?',
        'How do you rate limit streaming or WebSocket connections?',
        'How would you build a rate limit monitoring and alerting dashboard?',
      ],
    },
    {
      id: 'distributed-cache',
      title: 'Design a Distributed Cache',
      subtitle: 'Like Redis or Memcached',
      difficulty: 'Hard',
      companies: ['Amazon', 'Google', 'Meta', 'Twitter', 'Airbnb', 'Netflix'],
      tags: ['Consistent Hashing', 'Eviction', 'Replication', 'TTL', 'Cache Stampede'],
      overview: 'Design a distributed in-memory cache that sits between your application and database to reduce latency and load. Core challenges: data distribution across nodes via consistent hashing, eviction policies, cache invalidation, and handling node failures without massive re-hashing.',
      expectedQuestions: [
        'How do you distribute cache data across multiple nodes?',
        'What are the different cache eviction policies?',
        'How do you handle cache invalidation (the hardest problem in CS)?',
        'What is cache stampede and how do you prevent it?',
        'How do you handle hot keys?',
        'How do you replicate data for fault tolerance?',
        'How do you add or remove nodes without losing data?',
      ],
      keyComponents: [
        { name: 'Consistent Hashing', description: 'Maps keys to nodes on a virtual ring. Adding/removing a node only remaps K/N keys (K=total keys, N=nodes). Virtual nodes ensure uniform distribution.' },
        { name: 'Eviction Policies', description: 'LRU (Least Recently Used): best general purpose, implemented with doubly linked list + hash map. LFU: better for frequency patterns. TTL: explicit expiry per key.' },
        { name: 'Replication', description: 'Each shard has 1 primary + 2 replicas. Reads from replicas, writes to primary. Async replication for performance. Raft for leader election on failure.' },
        { name: 'Write Policies', description: 'Write-through: write cache + DB simultaneously (consistent, slower). Write-around: skip cache on write (good for write-once data). Write-back: cache only, sync DB later (fast, risky).' },
        { name: 'Hot Key Handler', description: 'Monitor key access frequency. Replicate hot keys across multiple nodes. Client-side local cache for extreme hot keys. Add random suffix to distribute.' },
        { name: 'Cache Stampede Prevention', description: 'Probabilistic early expiration: randomly refresh before TTL expires. Mutex/lock: only first request rebuilds cache, rest wait. Background refresh pattern.' },
      ],
      designSteps: [
        'Cluster design: N nodes on consistent hash ring. Each node responsible for a range. V-nodes per physical node for balance.',
        'Client library: hash key → position on ring → find nearest node clockwise → connect directly.',
        'Replication: each shard = 1 primary + 2 replicas for 3 total copies. Raft consensus for leader election.',
        'LRU implementation: doubly linked list (most recent at head) + hash map (key → node pointer). O(1) get and put.',
        'Write-through vs write-back: use write-through for financial data (consistency), write-back for analytics (performance).',
        'Monitoring: track hit rate (target > 80%), eviction rate, memory usage, p99 latency. Alert on anomalies.',
        'Cache warming: on startup, pre-populate from DB with top N accessed keys to avoid cold-start stampede.',
      ],
      tradeoffs: [
        { aspect: 'LRU vs LFU', pro: 'LRU: simple, handles recency well', con: 'LFU: better for frequency patterns but higher per-key metadata overhead' },
        { aspect: 'Write-through vs Write-back', pro: 'Write-through: always consistent, simple', con: 'Write-back: better write performance but risk of data loss on crash' },
        { aspect: 'Replication Factor', pro: 'Higher factor: better fault tolerance and read throughput', con: 'Higher factor: more memory consumed, slower writes' },
      ],
      followUps: [
        'How do you migrate data when adding new cache nodes with consistent hashing?',
        'How do you debug low cache hit rates in production?',
        'How do you handle clock skew when comparing TTL expirations?',
        'How would you design a write-back cache that never loses data?',
      ],
    },
    {
      id: 'google-drive',
      title: 'Design Google Drive / Dropbox',
      subtitle: 'Cloud file storage and cross-device sync',
      difficulty: 'Hard',
      companies: ['Google', 'Dropbox', 'Microsoft', 'Box', 'Apple'],
      tags: ['File Storage', 'Delta Sync', 'Object Storage', 'Chunking', 'Deduplication'],
      overview: 'Design a cloud file storage service that allows users to upload, download, and sync files across multiple devices. Core challenges: efficient large file uploads via chunking, delta sync to transfer only changes, conflict resolution, and global deduplication to save storage.',
      expectedQuestions: [
        'How do you handle large file uploads efficiently?',
        'How do you sync files across multiple devices?',
        'How do you detect and resolve sync conflicts?',
        'How do you implement file versioning?',
        'How do you deduplicate files to save storage?',
        'How do you implement file sharing and permissions?',
        'How do you handle concurrent edits to the same file?',
      ],
      keyComponents: [
        { name: 'Block Storage Service', description: 'Files split into 4MB blocks. Each block hashed (SHA-256). Only changed blocks uploaded on modification (delta sync). Blocks stored in S3 — immutable, content-addressed.' },
        { name: 'Metadata Service', description: 'MySQL stores file metadata: name, path, size, owner, version, block list, created/modified timestamps. Sharded by userId.' },
        { name: 'Delta Sync Engine', description: 'Client computes block checksums locally. Sends only new/changed blocks. Reduces bandwidth by 90%+ for small edits to large files.' },
        { name: 'Sync Service', description: 'Notifies connected clients of changes via long polling or WebSocket. Kafka broadcasts change events to all connected device sessions.' },
        { name: 'Deduplication', description: 'Global content-addressed storage: block key = SHA256(block_content). Identical blocks across all users stored once. Reference-counted. Massive storage savings.' },
        { name: 'Versioning', description: 'Each save creates a new version snapshot (block list + metadata). Retention: last 30 days or 100 versions. Point-in-time restore supported.' },
      ],
      designSteps: [
        'Clarify: upload/download/sync, versioning, sharing, offline access. 1B users, 50M uploads/day.',
        'Chunking: split file into 4MB blocks. Hash each block with SHA-256. Client maintains local index of block hashes.',
        'Upload flow: Client → compute block hashes → ask server which blocks are missing → upload only new blocks → update metadata.',
        'Storage: S3 for blocks (key = SHA256 hash, immutable). MySQL for metadata. Redis for session state and change notifications.',
        'Sync: client registers via WebSocket or long poll. Kafka consumer pushes change events to registered clients. Client applies changes sequentially.',
        'Conflict resolution: if both devices modify same file offline, create conflict copy ("file (conflicted copy 2024-01-15).docx"). User resolves manually.',
        'Sharing: ACL table {fileId, userId, permission: read/write/owner}. Pre-signed S3 URLs for download (expire after 1hr).',
      ],
      tradeoffs: [
        { aspect: 'Block Size', pro: 'Smaller blocks (1MB): finer-grained delta sync', con: 'Smaller blocks: more metadata overhead and round trips per file' },
        { aspect: 'Push vs Pull Sync', pro: 'Push (WebSocket): real-time, instant across devices', con: 'Push: stateful connections per user session, more complex scaling' },
        { aspect: 'Global vs Per-user Dedup', pro: 'Global: maximum storage savings across all users', con: 'Global: privacy concern — can infer if file exists based on hash collision timing' },
      ],
      followUps: [
        'How do you implement real-time collaborative editing (Google Docs style)?',
        'How do you implement selective sync (choose which folders to sync)?',
        'How do you handle GDPR deletion requests across replicated/deduplicated storage?',
        'How do you implement file encryption at rest while supporting deduplication?',
      ],
    },
    {
      id: 'notification-system',
      title: 'Design a Notification System',
      subtitle: 'Push, email, and SMS at scale',
      difficulty: 'Medium',
      companies: ['Facebook', 'Twitter', 'Uber', 'Amazon', 'LinkedIn', 'Slack'],
      tags: ['Push Notifications', 'Message Queue', 'Fan-out', 'APNs', 'FCM', 'Idempotency'],
      overview: 'Design a notification system that sends push notifications, emails, and SMS to millions of users. Challenges: high throughput delivery, user preference management, deduplication across retries, priority queuing, and integrating with third-party providers (APNs, FCM, SendGrid, Twilio).',
      expectedQuestions: [
        'How do you send 1 million notifications in a second?',
        'How do you ensure a notification is delivered at least once?',
        'How do you handle user notification preferences and opt-outs?',
        'How do you prevent duplicate notifications?',
        'How do you prioritize critical vs marketing notifications?',
        'How do you handle delivery failure and retry?',
        'How do you track notification open rates and analytics?',
      ],
      keyComponents: [
        { name: 'Notification API', description: 'Internal API: {userId, type, template, data, priority, idempotencyKey}. Validates request, checks user preferences, enqueues.' },
        { name: 'User Preference Service', description: 'Per-user settings: enabled channels, quiet hours (9pm-8am), opt-outs per category. Checked before every notification. Stored in MySQL, cached in Redis.' },
        { name: 'Priority Kafka Topics', description: 'high-priority topic: 2FA, security alerts, payment confirmations. low-priority topic: marketing, digests. Separate consumer groups with different SLAs.' },
        { name: 'Push Notification Workers', description: 'Consume from Kafka. Call APNs (Apple) or FCM (Google) HTTP/2 APIs. Each worker handles ~10K notifications/sec. Exponential backoff on failure.' },
        { name: 'Email/SMS Workers', description: 'SendGrid or AWS SES for email. Twilio for SMS. Rate-limited to provider limits. Dead letter queue for permanently failed deliveries.' },
        { name: 'Deduplication Layer', description: 'Redis SET with idempotency key (hash of userId + notificationId) + 24hr TTL. Check before every send. Retries are safe — same key, no duplicate delivery.' },
      ],
      designSteps: [
        'Clarify: push/email/SMS, user preferences, priority levels, delivery guarantees, analytics. 1B users.',
        'Flow: Trigger (event or schedule) → Notification API → Preference check → Kafka → Workers → Provider APIs → Track delivery.',
        'Idempotency: caller provides idempotency key. Redis stores key → {status, result}. Duplicate calls return cached result immediately.',
        'Templates: stored in DB with variable interpolation. Rendered at send time. A/B test variant stored per userId.',
        'Priority: CRITICAL (2FA codes) → high Kafka topic, target delivery < 1s. MARKETING → low topic, OK with minutes delay.',
        'Retry: exponential backoff 1s → 2s → 4s → 8s → 16s. After 5 failures → dead letter queue. Alert on-call if DLQ grows.',
        'Analytics: delivery events (enqueued, sent, delivered, opened, clicked) → Kafka → data warehouse for reporting.',
      ],
      tradeoffs: [
        { aspect: 'At-least-once vs Exactly-once', pro: 'At-least-once: simpler, better reliability guarantees', con: 'At-least-once: duplicates possible on retry; need dedup layer' },
        { aspect: 'Sync vs Async Delivery', pro: 'Async (Kafka): absorbs spikes, decouples services', con: 'Async: latency; not suitable for time-critical 2FA codes without priority queue' },
        { aspect: 'Centralized vs Per-service', pro: 'Centralized: consistent UX, unified preference management', con: 'Centralized: single point of failure, all teams compete for capacity' },
      ],
      followUps: [
        'How do you implement scheduled notifications (send at 9am in user\'s local timezone)?',
        'How do you implement notification throttling (don\'t send more than N per hour)?',
        'How do you implement A/B testing for notification copy?',
        'How do you build an in-app notification inbox (notification bell with count)?',
      ],
    },
    {
      id: 'payment-system',
      title: 'Design a Payment System',
      subtitle: 'Like Stripe or PayPal',
      difficulty: 'Hard',
      companies: ['Stripe', 'PayPal', 'Square', 'Amazon', 'Shopify', 'Uber'],
      tags: ['ACID', 'Idempotency', 'Double-entry Ledger', 'Exactly-once', 'PCI-DSS'],
      overview: 'Design a payment processing system that handles transactions, manages balances, integrates with card networks, and ensures every dollar is accounted for. Non-negotiables: exactly-once processing, ACID transactions, idempotency for safe retries, and PCI-DSS compliance.',
      expectedQuestions: [
        'How do you ensure a payment is processed exactly once?',
        'How do you handle partial failures (charged but order not created)?',
        'How do you implement idempotency in payments?',
        'How do you design a double-entry ledger system?',
        'How do you detect and prevent fraud?',
        'How do you handle chargebacks and refunds?',
        'How do you handle currency conversion?',
      ],
      keyComponents: [
        { name: 'Payment Service', description: 'Accepts payment requests. Validates amount, currency, payment method. Creates idempotency key. Orchestrates the transaction flow.' },
        { name: 'Idempotency Layer', description: 'Every request has client-generated UUID idempotency key. Redis stores key → {status, result} for 24h. Duplicate requests return cached result — no re-charge.' },
        { name: 'Double-entry Ledger', description: 'Every transaction = two entries: debit one account, credit another. Sum of all entries across all accounts always = 0. Append-only — never update or delete.' },
        { name: 'Payment Gateway', description: 'Integrates with Visa/Mastercard networks. Handles 3D Secure authentication and card tokenization. Returns authorization code within 2-3 seconds.' },
        { name: 'Reconciliation Service', description: 'Nightly job compares internal ledger with bank/gateway statements. Auto-resolves small discrepancies. Alerts ops on large gaps. Ensures no money lost.' },
        { name: 'Fraud Detection', description: 'ML model scores each transaction in real-time (<100ms). Rules: unusual location, velocity (> 5 transactions/min), device fingerprinting. Flag for review or auto-decline.' },
      ],
      designSteps: [
        'Clarify: merchant payments, P2P transfers, refunds, multi-currency. 10M transactions/day.',
        'Idempotency: client generates UUID per transaction attempt. Server checks Redis before processing. Returns same response on retry — safe to retry on network failure.',
        'Transaction flow: Validate → Reserve funds (DB lock) → Call payment gateway → Success: finalize debit/credit entries → Release lock.',
        'Ledger: append-only table {txId, fromAccountId, toAccountId, amount, currency, type, timestamp}. Index on accountId + timestamp for balance queries.',
        'Distributed transactions (Saga pattern): Reserve → Confirm or Compensate. Each step has a compensating action if subsequent steps fail.',
        'PCI-DSS: never store raw card numbers. Use gateway tokenization. Encrypt sensitive data at rest (AES-256). Audit all access.',
        'Reconciliation: every night compare sum of ledger entries per account against gateway reports. Alert on discrepancy > threshold.',
      ],
      tradeoffs: [
        { aspect: 'Strong vs Eventual Consistency', pro: 'Strong: no money lost, no double-spend possible', con: 'Strong: lower throughput, higher latency on write path' },
        { aspect: 'Saga vs 2-Phase Commit', pro: 'Saga: resilient to partial failures, no distributed lock', con: 'Saga: complex compensation logic, eventual consistency' },
        { aspect: 'Sync vs Async Confirmation', pro: 'Sync: immediate payment confirmation to user', con: 'Sync: coupled to payment gateway uptime; timeout = ambiguous state' },
      ],
      followUps: [
        'How do you handle currency conversion and exchange rate fluctuations?',
        'How do you implement subscription billing with automatic retry on failure?',
        'How do you design the payout system for marketplace sellers?',
        'How do you implement multi-party split payments (e.g., Airbnb: guest → Airbnb → host)?',
      ],
    },
    {
      id: 'web-crawler',
      title: 'Design a Web Crawler',
      subtitle: 'Search engine indexer like Googlebot',
      difficulty: 'Hard',
      companies: ['Google', 'Amazon', 'Microsoft', 'Bing', 'Baidu', 'LinkedIn'],
      tags: ['BFS/DFS', 'Distributed Systems', 'URL Frontier', 'DNS', 'Politeness', 'Deduplication'],
      overview: 'A web crawler systematically browses the web to collect and index pages for a search engine. Starting from a set of seed URLs, it fetches pages, extracts new links, and repeats. Core challenges: crawling billions of pages efficiently, avoiding duplicate content, respecting robots.txt, and not overwhelming target servers.',
      expectedQuestions: [
        'How do you decide which URLs to crawl next (prioritization)?',
        'How do you avoid crawling the same page twice?',
        'How do you handle traps — infinite URL spaces like calendars or session IDs?',
        'How do you respect robots.txt and crawl politeness?',
        'How do you scale the crawler to billions of pages?',
        'How do you detect and handle duplicate content (same content, different URLs)?',
        'How do you handle dynamic pages rendered by JavaScript?',
        'How do you deal with spider traps and malicious sites?',
      ],
      keyComponents: [
        { name: 'URL Frontier', description: 'Priority queue of URLs to visit. Implements politeness (one request per domain per N seconds) and priority (PageRank, freshness, importance). Backed by disk for scale.' },
        { name: 'DNS Resolver Cache', description: 'DNS lookups are slow (10-200ms). Cache domain → IP with short TTL. Batch resolve domains in advance of crawling. Critical for throughput.' },
        { name: 'Fetcher', description: 'HTTP/HTTPS GET requests with crawler User-Agent. Follows redirects (up to 5 hops). Enforces timeout (30s). Reads robots.txt before crawling a domain.' },
        { name: 'HTML Parser & Link Extractor', description: 'Parses fetched HTML. Extracts all <a href> links. Normalizes URLs (lowercase, remove fragments, resolve relative URLs). Filters non-HTML content types.' },
        { name: 'Deduplication Service', description: 'URL dedup: Bloom filter (space-efficient, probabilistic) checks if URL seen before. Content dedup: SHA-256 hash of page content stored in distributed hash table.' },
        { name: 'Content Store', description: 'Raw HTML stored in object storage (S3). Metadata (URL, crawl timestamp, status, content hash, extracted links) stored in Cassandra or BigTable.' },
        { name: 'URL Scheduler', description: 'Assigns URLs to fetcher workers. Groups URLs by domain to enforce per-domain politeness delay. Distributes work across crawler nodes using consistent hashing on domain.' },
      ],
      designSteps: [
        'Clarify scope: how many pages? 1B pages. Fresh crawl or recrawl? Both. Depth limit? Focused vs full web. Handle JS-rendered pages?',
        'Estimation: 1B pages, avg 500KB = 500TB storage. At 1000 pages/sec = 11.5 days to crawl 1B pages. Need ~1000 fetcher threads.',
        'Seed URLs: start with a curated list of high-quality root URLs (Wikipedia, news sites, directories). Expand via extracted links (BFS).',
        'URL Frontier: two-level queue. Back queue per domain enforces politeness (min delay between requests to same domain). Front queue prioritizes by importance.',
        'Politeness: read robots.txt once per domain, cache for 24h. Minimum 1s delay between requests to same domain. Respect Crawl-delay directive.',
        'URL normalization: lowercase scheme + host, remove default ports, decode %XX, sort query params, remove tracking params (utm_*), strip fragments (#).',
        'Dedup: Bloom filter with 1B entries uses ~1.2GB RAM. False positive rate ~1% — acceptable (skip 1% new URLs, save massive storage).',
        'Content dedup: SimHash for near-duplicate detection. Exact dedup via SHA-256. Store only canonical version.',
        'Recrawling: high-importance pages (news) recrawled hourly. Static pages weekly. Use Last-Modified and ETag headers for conditional GET.',
        'Distributed: consistent hash on domain assigns all pages of a domain to same crawler node → enforces politeness without coordination.',
      ],
      tradeoffs: [
        { aspect: 'BFS vs DFS Crawl Order', pro: 'BFS: discovers high-quality pages earlier, better for freshness', con: 'BFS: large frontier queue; DFS uses less memory but gets stuck in deep paths' },
        { aspect: 'Bloom Filter for Dedup', pro: 'Bloom filter: O(1) lookup, very memory efficient (1.2GB for 1B URLs)', con: 'Bloom filter: false positives (never re-crawls a URL that looks duplicate); no deletion' },
        { aspect: 'Centralized vs Distributed Frontier', pro: 'Distributed: scales horizontally, no single bottleneck', con: 'Distributed: harder to enforce global politeness, coordination overhead' },
        { aspect: 'Static vs JS-rendered Crawling', pro: 'Static (wget-style): fast, lightweight, scales easily', con: 'Static: misses content rendered by JavaScript (SPAs); need headless browser (Puppeteer) for full fidelity' },
      ],
      followUps: [
        'How do you crawl JavaScript-heavy single-page applications (SPAs)?',
        'How would you implement focused crawling — only pages about a specific topic?',
        'How do you handle login-required pages or paywalled content?',
        'How would you design the indexing pipeline that processes crawled pages for search?',
        'How do you detect and avoid crawler traps (e.g., infinite calendar URLs)?',
      ],
    },
    {
      id: 'ad-click-aggregator',
      title: 'Design an Ad Click Aggregator',
      subtitle: 'Real-time click tracking and aggregation at scale',
      difficulty: 'Hard',
      companies: ['Google', 'Facebook', 'Twitter', 'Amazon', 'Snap', 'TikTok'],
      tags: ['Stream Processing', 'Aggregation', 'Kafka', 'OLAP', 'Idempotency', 'Time Windows'],
      overview: 'An ad click aggregator ingests billions of raw click events per day, aggregates them in real-time (clicks per ad per minute/hour), and serves this data to advertisers and internal bidding systems. Core challenges: exactly-once counting under high throughput, time-window aggregation, late-arriving events, and serving both real-time dashboards and historical reports.',
      expectedQuestions: [
        'How do you handle 1 million click events per second without losing any?',
        'How do you deduplicate clicks — same user clicking an ad multiple times?',
        'How do you aggregate clicks over time windows (last 1 min, 1 hour, 1 day)?',
        'How do you handle late-arriving click events?',
        'How do you distinguish real clicks from bot/fraudulent traffic?',
        'How do you serve real-time aggregates to advertiser dashboards?',
        'How do you reconcile real-time counts with end-of-day billing reports?',
      ],
      keyComponents: [
        { name: 'Click Event Collector', description: 'Lightweight HTTP endpoint receives click events from ad pixels/SDKs. Responds with 200 immediately (async processing). Validates schema, attaches server timestamp. Publishes to Kafka.' },
        { name: 'Kafka Message Bus', description: 'Partitioned by adId for ordered per-ad processing. Retains events for 7 days for replay. Multiple consumer groups: one for real-time aggregation, one for raw storage, one for fraud detection.' },
        { name: 'Stream Processor', description: 'Apache Flink or Kafka Streams consumes click events. Aggregates clicks per adId per time window (tumbling windows: 1min, 1hr). Emits partial aggregates continuously.' },
        { name: 'Click Deduplication', description: 'Deduplicate within a time window using Redis SET keyed by (userId + adId + windowId). TTL = window size. Prevents counting repeated clicks from the same user.' },
        { name: 'OLAP Store', description: 'Apache Druid or ClickHouse stores pre-aggregated time-series data. Optimized for "clicks for adId X in time range Y–Z" queries. Sub-second query latency on billions of rows.' },
        { name: 'Raw Event Store', description: 'All raw click events persisted to S3 (Parquet format, partitioned by date/hour). Source of truth for billing reconciliation, audit, and reprocessing after bugs.' },
        { name: 'Reconciliation Service', description: 'Nightly batch job (Apache Spark) reprocesses raw events from S3. Compares with real-time aggregates. Corrects discrepancies. Produces final billing-grade counts.' },
      ],
      designSteps: [
        'Clarify requirements: real-time dashboard (last 1min/1hr), historical reports, billing accuracy, fraud detection. 1B clicks/day = ~11,500/sec average, 100K/sec peak.',
        'Click ingestion: stateless collector servers behind load balancer. Write to Kafka immediately. Respond 200 to client without waiting for processing — decouple ingestion from aggregation.',
        'Kafka partitioning: partition by adId so all clicks for one ad go to one partition → ordered processing per ad, no cross-partition coordination needed.',
        'Deduplication: within each 1-minute window, use Redis SADD with key "dedup:{adId}:{userId}:{windowId}". Returns 0 if already exists → skip. Key expires after window closes.',
        'Stream aggregation: Flink tumbling window of 1 minute. State: {adId → clickCount} per window. On window close, emit final count to OLAP store.',
        'Late events: watermark-based handling. Accept events up to 2 minutes late. Events arriving after watermark go to a correction queue, applied as delta updates to already-emitted window.',
        'OLAP schema: {adId, timestamp_minute, clicks, unique_users, impressions}. Pre-aggregated at multiple granularities (1min, 1hr, 1day) for fast dashboard queries.',
        'Raw storage: Kafka consumer writes raw events to S3 in micro-batches (every 5min). Parquet format with Snappy compression. ~10GB/hr at 1B clicks/day.',
        'Billing reconciliation: batch Spark job runs nightly on raw S3 data. Canonical count = batch count. Resolve discrepancies with stream count. Real-time counts are "best-effort", batch is "source of truth".',
        'Fraud detection: separate Kafka consumer computes per-IP and per-userId click velocity. Flag if > 10 clicks/min on same ad from same source. Route suspicious events to quarantine for manual review.',
      ],
      tradeoffs: [
        { aspect: 'Real-time Stream vs Batch Aggregation', pro: 'Stream: low-latency counts for live dashboards and bidding decisions', con: 'Stream: harder to guarantee exactly-once; batch is simpler and more accurate for billing' },
        { aspect: 'Lambda vs Kappa Architecture', pro: 'Lambda (stream + batch): stream for speed, batch for accuracy — best of both', con: 'Lambda: two code paths to maintain; Kappa (stream only) is simpler but replay is complex' },
        { aspect: 'Per-window Dedup in Redis', pro: 'Redis SET: O(1) dedup, low latency', con: 'Redis: memory-intensive at scale; window expiry must be tightly managed to avoid false dedup across windows' },
        { aspect: 'Pre-aggregated OLAP vs Raw Query', pro: 'Pre-aggregated: sub-second dashboard queries regardless of data volume', con: 'Pre-aggregated: fixed granularity; ad-hoc queries on raw data need full Spark scan' },
      ],
      followUps: [
        'How would you design the billing system that charges advertisers based on click counts?',
        'How do you handle a bug in the stream processor that caused undercounting for 2 hours?',
        'How do you implement click-through rate (CTR) aggregation alongside raw click counts?',
        'How would you extend this to support impression tracking and conversion attribution?',
        'How do you prevent click fraud at the ingestion layer before it enters the pipeline?',
      ],
    },
  ],

  dsa: [
    {
      id: 'arrays',
      title: 'Arrays',
      difficulty: 'Easy',
      pattern: 'Fundamentals',
      companies: ['Google', 'Amazon', 'Microsoft', 'Apple', 'Facebook'],
      tags: ['Prefix Sum', 'In-place', 'Kadane\'s', 'Sorting', 'Hash Map'],
      overview: 'Arrays are the most fundamental data structure — contiguous memory storing elements of the same type. Most interview problems involve arrays directly. Mastery of prefix sums, in-place manipulation, and the interplay between arrays and hash maps is non-negotiable.',
      problems: [
        { name: 'Two Sum', difficulty: 'Easy', note: 'Hash map: store seen values, O(n)' },
        { name: 'Best Time to Buy and Sell Stock', difficulty: 'Easy', note: 'Track min price seen so far, update max profit' },
        { name: 'Maximum Subarray (Kadane\'s)', difficulty: 'Medium', note: 'dp: maxEndingHere = max(nums[i], maxEndingHere + nums[i])' },
        { name: 'Product of Array Except Self', difficulty: 'Medium', note: 'Build prefix and suffix product arrays, no division' },
        { name: 'Container With Most Water', difficulty: 'Medium', note: 'Two pointers from ends, move the shorter side' },
        { name: 'Trapping Rain Water', difficulty: 'Hard', note: 'Prefix max arrays left/right, or two pointers' },
        { name: 'Merge Intervals', difficulty: 'Medium', note: 'Sort by start, merge if current.start <= prev.end' },
        { name: 'Rotate Array', difficulty: 'Medium', note: 'Reverse entire, then reverse two halves' },
      ],
      approach: `Key techniques to master:

1. Prefix Sum
   Build cumulative sum array once in O(n).
   Query any range sum in O(1): sum[l..r] = prefix[r] - prefix[l-1]

2. Two Pointers
   Start from both ends, move inward based on condition.
   Converts many O(n²) brutes to O(n). Requires sorted array or monotonic property.

3. Kadane's Algorithm
   maxEndingHere = max(nums[i], maxEndingHere + nums[i])
   maxSoFar = max(maxSoFar, maxEndingHere)

4. Write Pointer (In-place)
   write = 0
   for read in range(len(arr)):
       if should_keep(arr[read]):
           arr[write] = arr[read]
           write += 1

5. Hash Map Lookup
   "Have we seen this value before?" → hash set O(1) vs linear scan O(n)`,
      keyInsights: [
        'Most O(n²) brute forces optimize to O(n) with a hash map (trade space for time).',
        'If array is sorted, think two pointers or binary search before anything else.',
        'Prefix sum enables O(1) range queries — very common in subarray problems.',
        'In-place manipulation usually means write pointer or swap-based approach.',
        'Off-by-one errors are the #1 bug — always verify boundary conditions on a small example.',
      ],
      timeComplexity: 'O(n) for most optimal solutions; O(n log n) when sorting is required',
      spaceComplexity: 'O(1) for in-place; O(n) with hash map or prefix sum array',
      commonMistakes: [
        'Accessing out-of-bounds indices — always check i < len(arr).',
        'Not handling empty array or single-element inputs as edge cases.',
        'Using Python slices in loops — they create copies and cost O(k) each time.',
        'Off-by-one in sliding window or two-pointer endpoints.',
      ],
    },
    {
      id: 'two-pointers',
      title: 'Two Pointers',
      difficulty: 'Easy',
      pattern: 'Two Pointers',
      companies: ['Amazon', 'Google', 'Facebook', 'Apple', 'Microsoft'],
      tags: ['Sorted Array', 'In-place', 'Palindrome', 'Partitioning', 'Opposite Ends'],
      overview: 'Two pointers uses two index variables to traverse an array or string, often from opposite ends or at different speeds. It converts many O(n²) brute forces to O(n) by eliminating redundant comparisons through monotonic movement.',
      problems: [
        { name: 'Valid Palindrome', difficulty: 'Easy', note: 'Left and right pointers converge toward center' },
        { name: 'Two Sum II (sorted array)', difficulty: 'Easy', note: 'Move left if sum too small, right if too large' },
        { name: 'Remove Duplicates from Sorted Array', difficulty: 'Easy', note: 'Write pointer + read pointer' },
        { name: '3Sum', difficulty: 'Medium', note: 'Sort, fix first element, two-pointer for remaining two' },
        { name: 'Container With Most Water', difficulty: 'Medium', note: 'Always move the pointer with the shorter height' },
        { name: 'Trapping Rain Water', difficulty: 'Hard', note: 'Two pointers with leftMax and rightMax tracking' },
        { name: 'Sort Colors (Dutch National Flag)', difficulty: 'Medium', note: 'Three-pointer partition: low, mid, high' },
      ],
      approach: `When to use: array is sorted OR you need to find pairs/triplets with a property.

Template 1 — Opposite ends (pair sum):
left, right = 0, len(arr) - 1
while left < right:
    current = arr[left] + arr[right]
    if current == target:
        record result
        left += 1; right -= 1
    elif current < target:
        left += 1
    else:
        right -= 1

Template 2 — Write pointer (in-place removal):
write = 0
for read in range(len(arr)):
    if arr[read] != value_to_skip:
        arr[write] = arr[read]
        write += 1
return write  # new length

Template 3 — 3Sum (sort + fix + two-pointer):
sort(nums)
for i in range(len(nums) - 2):
    if i > 0 and nums[i] == nums[i-1]: continue  # skip duplicates
    left, right = i+1, len(nums)-1
    # standard two-pointer on rest`,
      keyInsights: [
        'Always establish a clear reason to move each pointer — random movement leads to infinite loops or wrong answers.',
        'For 3Sum/4Sum: sort first, fix outermost element(s), two-pointer for the inner pair.',
        'Fast/slow pointer (different speeds) detects cycles — works on linked lists too.',
        'Two pointers on strings: palindrome check is the classic example.',
      ],
      timeComplexity: 'O(n) for single pass; O(n log n) if sorting required first; O(n²) for 3Sum',
      spaceComplexity: 'O(1) — no extra space needed',
      commonMistakes: [
        'Not sorting the array when the algorithm requires it.',
        'Both pointers moving when only one should — ensure at least one always moves.',
        'Duplicate handling in 3Sum: skip duplicates after recording a valid triplet.',
        'Confusing "find all pairs" (need to record multiple) with "find one pair" (return immediately).',
      ],
    },
    {
      id: 'sliding-window',
      title: 'Sliding Window',
      difficulty: 'Medium',
      pattern: 'Sliding Window',
      companies: ['Amazon', 'Google', 'Microsoft', 'Bloomberg', 'Uber'],
      tags: ['Substring', 'Subarray', 'Variable Window', 'Fixed Window', 'Hash Map'],
      overview: 'Sliding window optimizes contiguous subarray/substring problems. Instead of recomputing from scratch for each position, you slide the window by adding the new right element and removing the old left element — achieving O(n) vs O(n²) or O(n³) brute force.',
      problems: [
        { name: 'Maximum Average Subarray I', difficulty: 'Easy', note: 'Fixed window of size k' },
        { name: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', note: 'Variable window, shrink when duplicate found' },
        { name: 'Minimum Size Subarray Sum', difficulty: 'Medium', note: 'Variable window, shrink when sum >= target' },
        { name: 'Longest Repeating Character Replacement', difficulty: 'Medium', note: 'Window valid if (len - maxFreq) <= k' },
        { name: 'Permutation in String', difficulty: 'Medium', note: 'Fixed window = len(s1), compare char frequency maps' },
        { name: 'Minimum Window Substring', difficulty: 'Hard', note: 'Variable window tracking count of matched required chars' },
        { name: 'Sliding Window Maximum', difficulty: 'Hard', note: 'Monotonic deque maintains max in current window' },
      ],
      approach: `Fixed window (size k):
window_sum = sum(arr[:k])
result = window_sum
for i in range(k, len(arr)):
    window_sum += arr[i] - arr[i - k]
    result = max(result, window_sum)

Variable window (expand right, shrink left until valid):
left = 0
for right in range(len(arr)):
    # Add arr[right] to window state (e.g., freq map, sum)
    window_state.add(arr[right])

    while window_is_invalid():
        # Remove arr[left] from window state
        window_state.remove(arr[left])
        left += 1

    # Window [left..right] is valid — update answer
    answer = max(answer, right - left + 1)`,
      keyInsights: [
        'Variable window: right expands unconditionally, left shrinks until window becomes valid again.',
        'Use a Counter/dict for character frequency window problems.',
        'Identify fixed vs variable: "subarray of exactly size k" = fixed; "longest/shortest satisfying X" = variable.',
        '"At most k" vs "exactly k": exactly k = at_most(k) - at_most(k-1).',
      ],
      timeComplexity: 'O(n) — each element enters and exits the window at most once',
      spaceComplexity: 'O(1) for numeric sums; O(k) or O(26) for character frequency maps',
      commonMistakes: [
        'Not handling the case where no valid window exists (return 0 or "").',
        'For variable window, forgetting to update answer before or after shrinking.',
        'Confusing "at most k" vs "exactly k" — different termination conditions.',
        'Off-by-one in window size: right - left + 1.',
      ],
    },
    {
      id: 'binary-search',
      title: 'Binary Search',
      difficulty: 'Easy',
      pattern: 'Binary Search',
      companies: ['Google', 'Amazon', 'Facebook', 'Apple', 'Airbnb'],
      tags: ['Sorted Array', 'Search Space', 'Logarithmic', 'Binary Search on Answer', 'Monotonic'],
      overview: 'Binary search halves the search space each iteration, achieving O(log n). It applies not just to sorted arrays but to any monotonic predicate — "if condition(mid) is true, what about condition(mid+1)?" This generalization enables a huge class of optimization problems.',
      problems: [
        { name: 'Binary Search', difficulty: 'Easy', note: 'Classic implementation — master this first' },
        { name: 'Search in Rotated Sorted Array', difficulty: 'Medium', note: 'Determine which half is sorted, search that half' },
        { name: 'Find Minimum in Rotated Sorted Array', difficulty: 'Medium', note: 'Binary search on pivot point' },
        { name: 'Koko Eating Bananas', difficulty: 'Medium', note: 'Binary search on answer (eating speed)' },
        { name: 'Find Peak Element', difficulty: 'Medium', note: 'Binary search on property: move toward larger neighbor' },
        { name: 'Search a 2D Matrix', difficulty: 'Medium', note: 'Treat as flat 1D sorted array, convert index' },
        { name: 'Median of Two Sorted Arrays', difficulty: 'Hard', note: 'Binary search on partition point of smaller array' },
      ],
      approach: `Classic (find exact target):
left, right = 0, len(arr) - 1
while left <= right:
    mid = left + (right - left) // 2  # avoids overflow
    if arr[mid] == target:
        return mid
    elif arr[mid] < target:
        left = mid + 1
    else:
        right = mid - 1
return -1

Binary search on answer (find minimum valid value):
left, right = min_possible_answer, max_possible_answer
while left < right:
    mid = (left + right) // 2
    if is_feasible(mid):
        right = mid      # try smaller
    else:
        left = mid + 1   # need larger
return left  # smallest feasible value

Key insight: is_feasible() must be monotonic:
  False False False [True True True True]
                     ^--- left converges here`,
      keyInsights: [
        '"Binary search on the answer" when asked for minimum/maximum value satisfying a condition.',
        'The predicate must be monotonic: once it flips from false to true, it stays true.',
        'Use left + (right-left)//2 to prevent integer overflow in languages with fixed int size.',
        'Decide your invariant: left <= right (inclusive) vs left < right — be consistent.',
      ],
      timeComplexity: 'O(log n) for standard; O(f(n) × log n) for "binary search on answer" where f(n) = cost of feasibility check',
      spaceComplexity: 'O(1) iterative; O(log n) recursive due to call stack',
      commonMistakes: [
        'Integer overflow with (left + right) / 2 — always use left + (right-left)/2.',
        'Infinite loop: if left == right and condition is left <= right, mid == left, and neither branch changes left.',
        'Not defining invariant clearly — should right = mid or right = mid-1 when condition is true?',
        'Off-by-one: what happens at the boundary? Trace a 2-element example.',
      ],
    },
    {
      id: 'linked-lists',
      title: 'Linked Lists',
      difficulty: 'Easy',
      pattern: 'Pointer Manipulation',
      companies: ['Amazon', 'Microsoft', 'Google', 'Facebook', 'Bloomberg'],
      tags: ['Slow/Fast Pointer', 'Reversal', 'Cycle Detection', 'Merge', 'Dummy Node'],
      overview: 'Linked list problems test precise pointer manipulation. Key techniques: fast/slow pointers for cycle detection and finding middle, in-place reversal, and dummy head node for clean edge-case handling. Visualizing pointer changes on paper before coding is essential.',
      problems: [
        { name: 'Reverse Linked List', difficulty: 'Easy', note: 'Iterative: prev/curr/next pointers' },
        { name: 'Linked List Cycle', difficulty: 'Easy', note: 'Floyd\'s: slow and fast meet if cycle exists' },
        { name: 'Merge Two Sorted Lists', difficulty: 'Easy', note: 'Dummy head node eliminates null checks' },
        { name: 'Remove Nth Node From End', difficulty: 'Medium', note: 'Two pointers n steps apart' },
        { name: 'Reorder List', difficulty: 'Medium', note: 'Find middle, reverse second half, merge alternating' },
        { name: 'LRU Cache', difficulty: 'Medium', note: 'Doubly linked list + hash map, O(1) all operations' },
        { name: 'Merge K Sorted Lists', difficulty: 'Hard', note: 'Min-heap of (value, list_index, node)' },
      ],
      approach: `Reversal (iterative):
prev, curr = None, head
while curr:
    next_node = curr.next   # save before overwrite
    curr.next = prev        # reverse pointer
    prev = curr
    curr = next_node
return prev  # new head

Slow/fast pointer (find middle or detect cycle):
slow = fast = head
while fast and fast.next:
    slow = slow.next        # moves 1 step
    fast = fast.next.next   # moves 2 steps
# slow = middle when fast reaches end

Dummy node (safe insertion/deletion at head):
dummy = ListNode(0)
dummy.next = head
curr = dummy
while curr.next:
    # manipulate curr.next
    curr = curr.next
return dummy.next`,
      keyInsights: [
        'Dummy head eliminates special-case code for inserting/deleting the first node.',
        'Fast/slow pointer: if they meet, cycle exists. To find cycle start: reset slow to head, advance both 1 step at a time.',
        'For kth from end: advance one pointer k steps, then move both until first hits null.',
        'Draw the linked list and annotate pointer arrows before writing code — one wrong assignment corrupts the entire list.',
      ],
      timeComplexity: 'O(n) for most operations',
      spaceComplexity: 'O(1) for iterative pointer solutions; O(n) for recursive solutions (call stack)',
      commonMistakes: [
        'Losing reference to a node before updating its pointer — always save next before overwriting.',
        'Not handling empty list (head = null) or single-node as edge cases.',
        'Circular reference bugs — verify tail.next = null after manipulation.',
        'Forgetting to update both head and tail pointers when list structure changes.',
      ],
    },
    {
      id: 'trees',
      title: 'Trees & Binary Search Trees',
      difficulty: 'Medium',
      pattern: 'DFS / BFS',
      companies: ['Amazon', 'Google', 'Microsoft', 'Facebook', 'Apple'],
      tags: ['DFS', 'BFS', 'Recursion', 'BST Property', 'Level Order', 'Path Sum'],
      overview: 'Tree problems are among the most frequent in interviews. They test recursive thinking. Key traversals: inorder (L-Root-R gives sorted order in BST), preorder (Root-L-R for serialization), postorder (L-R-Root for bottom-up computation), and BFS (level order).',
      problems: [
        { name: 'Maximum Depth of Binary Tree', difficulty: 'Easy', note: '1 + max(depth(left), depth(right))' },
        { name: 'Invert Binary Tree', difficulty: 'Easy', note: 'Swap left/right children, recurse' },
        { name: 'Same Tree', difficulty: 'Easy', note: 'Recursive: check val + same(left) + same(right)' },
        { name: 'Level Order Traversal', difficulty: 'Medium', note: 'BFS with queue, capture level_size at start of each level' },
        { name: 'Validate BST', difficulty: 'Medium', note: 'Pass min/max bounds recursively: left subtree max = root.val' },
        { name: 'Lowest Common Ancestor', difficulty: 'Medium', note: 'If both p,q in left → LCA in left; both in right → right; else root' },
        { name: 'Binary Tree Maximum Path Sum', difficulty: 'Hard', note: 'Postorder DFS, track global max, return single-branch max upward' },
        { name: 'Serialize / Deserialize Binary Tree', difficulty: 'Hard', note: 'Preorder with null markers for deserialize' },
      ],
      approach: `DFS template (recursive):
def dfs(node):
    if not node:
        return base_case      # e.g., 0 for height, True for empty tree
    left_result  = dfs(node.left)
    right_result = dfs(node.right)
    return combine(left_result, right_result, node.val)

BFS (level order):
from collections import deque
queue = deque([root])
while queue:
    level_size = len(queue)      # capture before loop
    for _ in range(level_size):
        node = queue.popleft()
        process(node)
        if node.left:  queue.append(node.left)
        if node.right: queue.append(node.right)

BST validation (pass bounds down):
def validate(node, lo=float('-inf'), hi=float('inf')):
    if not node: return True
    if not (lo < node.val < hi): return False
    return (validate(node.left, lo, node.val) and
            validate(node.right, node.val, hi))`,
      keyInsights: [
        'Most tree problems reduce to: compute something bottom-up (postorder), find a path (DFS + global var), or process level by level (BFS).',
        'BST inorder traversal produces a sorted sequence — key insight for validation and kth-smallest.',
        'When recursion needs to return multiple values, use an instance variable or a class for the global "answer".',
        'Height = O(log n) balanced, O(n) skewed — this affects worst-case recursion stack depth.',
      ],
      timeComplexity: 'O(n) for traversal — every node visited once',
      spaceComplexity: 'O(h) where h = height: O(log n) balanced, O(n) skewed (call stack)',
      commonMistakes: [
        'Not handling the null node base case — always check "if not node: return ..."',
        'Confusing inorder/preorder/postorder — draw the tree and trace manually on paper.',
        'BST validation: comparing to direct parent only is wrong — must propagate bounds from all ancestors.',
        'Appending to result inside recursion without a "depth" parameter for level-based grouping.',
      ],
    },
    {
      id: 'graphs',
      title: 'Graphs',
      difficulty: 'Medium',
      pattern: 'BFS / DFS',
      companies: ['Google', 'Facebook', 'Amazon', 'Airbnb', 'LinkedIn'],
      tags: ['BFS', 'DFS', 'Topological Sort', 'Union-Find', 'Dijkstra', 'Cycle Detection'],
      overview: 'Graphs model relationships between entities. Key algorithms: BFS (shortest path in unweighted graphs), DFS (cycle detection, path existence), Topological Sort (ordering with dependencies), Union-Find (connected components), and Dijkstra (shortest path in weighted graphs).',
      problems: [
        { name: 'Number of Islands', difficulty: 'Medium', note: 'DFS/BFS flood fill from each unvisited land cell' },
        { name: 'Clone Graph', difficulty: 'Medium', note: 'DFS with visited map: originalNode → clonedNode' },
        { name: 'Course Schedule (Cycle Detection)', difficulty: 'Medium', note: 'Topological sort with in-degree, or DFS 3-color' },
        { name: 'Pacific Atlantic Water Flow', difficulty: 'Medium', note: 'Reverse BFS from each ocean, find intersection' },
        { name: 'Word Ladder', difficulty: 'Hard', note: 'BFS on implicit word graph, bi-directional BFS optimal' },
        { name: 'Number of Connected Components', difficulty: 'Medium', note: 'Union-Find with path compression or DFS count' },
        { name: 'Cheapest Flights Within K Stops', difficulty: 'Medium', note: 'Bellman-Ford k iterations, or BFS with cost' },
        { name: 'Network Delay Time', difficulty: 'Medium', note: 'Dijkstra from source, return max dist in visited' },
      ],
      approach: `BFS (shortest path, level by level):
from collections import deque
visited = {start}
queue = deque([(start, 0)])  # (node, distance)
while queue:
    node, dist = queue.popleft()
    if node == target: return dist
    for neighbor in graph[node]:
        if neighbor not in visited:
            visited.add(neighbor)
            queue.append((neighbor, dist + 1))

DFS (path existence, cycle detection):
visited = set()
def dfs(node):
    visited.add(node)
    for neighbor in graph[node]:
        if neighbor not in visited:
            dfs(neighbor)

Topological Sort (Kahn's BFS):
1. Compute in-degree for every node.
2. Enqueue all nodes with in-degree = 0.
3. BFS: dequeue node, decrement neighbor in-degrees, enqueue newly zero-degree nodes.
4. If total processed < total nodes → cycle exists.`,
      keyInsights: [
        'BFS = shortest path (unweighted). Whenever problem asks for minimum steps/hops, reach for BFS.',
        'Mark visited BEFORE adding to queue, not after dequeue — prevents adding same node multiple times.',
        'For disconnected graphs: outer loop over all nodes ensures every component is visited.',
        'DFS cycle detection in directed graph: need recursion stack (in-progress set), not just visited set.',
      ],
      timeComplexity: 'O(V + E) for BFS/DFS where V = vertices, E = edges',
      spaceComplexity: 'O(V) for visited set + queue/stack',
      commonMistakes: [
        'Not marking visited before enqueue → exponential duplicates in BFS queue.',
        'Using DFS for shortest path — DFS finds a path, not necessarily the shortest.',
        'Forgetting to iterate over all nodes for disconnected graphs.',
        'Directed cycle detection: "visited" alone is insufficient, need to track nodes on current DFS path.',
      ],
    },
    {
      id: 'dynamic-programming',
      title: 'Dynamic Programming',
      difficulty: 'Hard',
      pattern: 'Dynamic Programming',
      companies: ['Google', 'Amazon', 'Facebook', 'Apple', 'Bloomberg', 'Palantir'],
      tags: ['Memoization', 'Tabulation', 'Optimal Substructure', 'Overlapping Subproblems', 'State Reduction'],
      overview: 'Dynamic programming solves problems by breaking them into overlapping subproblems and caching results. Two approaches: top-down (recursion + memoization) and bottom-up (tabulation). The key is identifying: what is the state? what is the recurrence? what are the base cases?',
      problems: [
        { name: 'Climbing Stairs', difficulty: 'Easy', note: 'dp[i] = dp[i-1] + dp[i-2] (Fibonacci)' },
        { name: 'House Robber', difficulty: 'Medium', note: 'dp[i] = max(dp[i-2] + nums[i], dp[i-1])' },
        { name: 'Coin Change', difficulty: 'Medium', note: 'dp[amount] = min coins to make amount; init with infinity' },
        { name: 'Longest Common Subsequence', difficulty: 'Medium', note: '2D DP: if match dp[i][j] = dp[i-1][j-1]+1 else max(dp[i-1][j], dp[i][j-1])' },
        { name: 'Word Break', difficulty: 'Medium', note: 'dp[i] = can we form s[:i] from word dictionary' },
        { name: '0/1 Knapsack', difficulty: 'Medium', note: 'dp[i][w] = max value with first i items and capacity w' },
        { name: 'Longest Increasing Subsequence', difficulty: 'Medium', note: 'dp[i] = LIS length ending at index i; O(n log n) with patience sort' },
        { name: 'Edit Distance', difficulty: 'Hard', note: '2D DP; insert/delete/replace each cost 1' },
        { name: 'Burst Balloons', difficulty: 'Hard', note: 'Interval DP: think about which balloon to pop LAST in a range' },
      ],
      approach: `4-step framework:

1. Define state: what does dp[i] mean?
   Example: dp[i] = minimum coins to make amount i

2. Recurrence: how does dp[i] depend on smaller subproblems?
   dp[i] = min(dp[i - coin] + 1) for each coin <= i

3. Base cases: dp[0] = 0 (0 coins for amount 0)

4. Traversal order: ensure dependencies computed before use.

1D bottom-up template:
dp = [float('inf')] * (n + 1)
dp[0] = 0  # base case
for i in range(1, n + 1):
    for each_option in options:
        if valid: dp[i] = min/max(dp[i], dp[prev] + cost)

2D bottom-up template (e.g., LCS):
dp = [[0] * (m + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    for j in range(1, m + 1):
        if s1[i-1] == s2[j-1]:
            dp[i][j] = dp[i-1][j-1] + 1
        else:
            dp[i][j] = max(dp[i-1][j], dp[i][j-1])`,
      keyInsights: [
        'If you can solve it with recursion + memoization, bottom-up conversion is usually straightforward.',
        'Most 1D DP only needs last 1-2 states — save space by using variables instead of array.',
        'Pattern: "longest/shortest/count/min/max over subarrays or subsequences" → likely DP.',
        'Interval DP (matrix chain, burst balloons): dp[i][j] = optimal for subproblem on range [i, j].',
      ],
      timeComplexity: 'O(n²) for most 1D DP; O(n×m) for 2D string DP; varies by state space',
      spaceComplexity: 'O(n) or O(n×m); reducible to O(1) or O(n) with rolling array optimization',
      commonMistakes: [
        'Vague state definition leads to wrong recurrence — define dp[i] precisely in English first.',
        'Wrong base cases — trace through a 2-element example by hand.',
        'Off-by-one: returning dp[n-1] vs dp[n] depends on 0-indexed vs 1-indexed definition.',
        'Not initializing DP array with correct default (0 for max-count, infinity for minimization).',
      ],
    },
    {
      id: 'backtracking',
      title: 'Backtracking',
      difficulty: 'Hard',
      pattern: 'Backtracking / Recursion',
      companies: ['Google', 'Amazon', 'Facebook', 'Microsoft'],
      tags: ['Recursion', 'Pruning', 'Permutations', 'Combinations', 'Subsets', 'State Space'],
      overview: 'Backtracking explores all candidate solutions by building them incrementally, abandoning a candidate ("backtracking") as soon as it violates a constraint. It is DFS on a decision tree. Classic problems: subsets, permutations, combinations, N-Queens, Sudoku.',
      problems: [
        { name: 'Subsets', difficulty: 'Medium', note: 'At each element: include OR exclude, recurse both' },
        { name: 'Permutations', difficulty: 'Medium', note: 'Swap elements in-place, recurse, swap back' },
        { name: 'Combination Sum', difficulty: 'Medium', note: 'Can reuse same element; pass same index forward' },
        { name: 'Letter Combinations of Phone Number', difficulty: 'Medium', note: 'Try each letter for current digit, recurse on next' },
        { name: 'Palindrome Partitioning', difficulty: 'Medium', note: 'Try every prefix, check isPalindrome, recurse on suffix' },
        { name: 'N-Queens', difficulty: 'Hard', note: 'Track col set, diagonal set, anti-diagonal set for O(1) conflict check' },
        { name: 'Word Search', difficulty: 'Medium', note: 'DFS from each cell, mark visited in-place, unmark on backtrack' },
        { name: 'Sudoku Solver', difficulty: 'Hard', note: 'Try 1-9 in empty cells, prune via row/col/box constraint sets' },
      ],
      approach: `Universal backtracking template:
result = []
def backtrack(start_index, current_path):
    if is_complete(current_path):
        result.append(current_path[:])  # COPY — not reference
        return
    for choice in get_choices(start_index):
        if is_valid(choice, current_path):
            current_path.append(choice)       # make choice
            backtrack(next_index, current_path)
            current_path.pop()                # UNDO choice (backtrack)

Key decisions per problem:
- Choices: what can I pick at this position?
- Termination: when is current_path a complete solution?
- Validity / Pruning: what makes a choice invalid?
- start_index: prevents reusing earlier elements (combinations, not permutations)

Avoiding duplicates:
- Sort input first
- Skip arr[i] == arr[i-1] at same recursion depth
- Or use a seen set at each level`,
      keyInsights: [
        'The undo/backtrack step must perfectly reverse the make step — asymmetric undos cause subtle bugs.',
        'Avoid duplicates: sort input + skip duplicate values at the same recursion level.',
        'Always append a copy of current_path to result, not the reference — all results will otherwise be the same final state.',
        'Prune early: if remaining sum can never reach target (e.g., remaining < 0), return immediately before exploring further.',
      ],
      timeComplexity: 'O(2^n × n) for subsets; O(n! × n) for permutations; varies with pruning',
      spaceComplexity: 'O(n) recursion depth; O(2^n × n) for storing all results in memory',
      commonMistakes: [
        'Forgetting to undo — appending to shared list without popping causes all paths to pollute each other.',
        'Appending current_path directly (reference) instead of current_path[:] (copy).',
        'Generating duplicate combinations — need sort + skip-if-same-as-previous at each level.',
        'Not pruning — causes TLE on large inputs even when logic is correct.',
      ],
    },
    {
      id: 'heaps',
      title: 'Heaps & Priority Queue',
      difficulty: 'Medium',
      pattern: 'Heap',
      companies: ['Amazon', 'Google', 'Microsoft', 'Twitter', 'Uber'],
      tags: ['Min-Heap', 'Max-Heap', 'K Largest', 'K Smallest', 'Merge K', 'Median Stream'],
      overview: 'A heap is a complete binary tree satisfying the heap property: parent ≤ children (min-heap) or parent ≥ children (max-heap). Provides O(log n) insert and O(log n) extract. Essential pattern: any problem asking for "k largest/smallest", "top-k frequent", or "merge k sorted" almost always uses a heap.',
      problems: [
        { name: 'Kth Largest Element in Array', difficulty: 'Medium', note: 'Min-heap of size k; replace top if new element is larger' },
        { name: 'Top K Frequent Elements', difficulty: 'Medium', note: 'Count frequencies, use heap of size k on frequency' },
        { name: 'Find Median from Data Stream', difficulty: 'Hard', note: 'Max-heap (lower half) + min-heap (upper half), keep balanced' },
        { name: 'Merge K Sorted Lists', difficulty: 'Hard', note: 'Min-heap initialized with first node of each list' },
        { name: 'Task Scheduler', difficulty: 'Medium', note: 'Max-heap of task frequencies, simulate cooldown window' },
        { name: 'K Closest Points to Origin', difficulty: 'Medium', note: 'Max-heap of size k on Euclidean distance' },
        { name: 'Reorganize String', difficulty: 'Medium', note: 'Max-heap, always place most frequent char that isn\'t last placed' },
      ],
      approach: `Python heapq is a min-heap by default:
import heapq
heap = []
heapq.heappush(heap, val)     # O(log n), insert
heapq.heappop(heap)           # O(log n), remove & return min
heap[0]                       # O(1), peek min without removing

Max-heap: negate values
heapq.heappush(heap, -val)
max_val = -heapq.heappop(heap)

Build heap from list: O(n) using heapify
heapq.heapify(existing_list)  # in-place, O(n) vs O(n log n) for repeated push

K-th Largest pattern (min-heap of size k):
heap = []
for num in nums:
    heapq.heappush(heap, num)
    if len(heap) > k:
        heapq.heappop(heap)   # remove smallest — keeps k largest
return heap[0]                # kth largest = minimum of top-k

Median stream (two heaps):
lower = []  # max-heap (store negated) — lower half
upper = []  # min-heap — upper half
# Invariant: len(lower) == len(upper) or len(lower) == len(upper) + 1`,
      keyInsights: [
        '"K something" problems (top-k, kth largest/smallest) almost always use a bounded heap of size k.',
        'For kth largest: min-heap of size k. New element larger than heap minimum → replace minimum.',
        'Median of stream: two heaps. Lower half (max-heap) + upper half (min-heap). Rebalance after each insert.',
        'Heap + lazy deletion: mark deleted items, skip them when popping. Avoids O(n) removal from heap.',
      ],
      timeComplexity: 'O(n log k) for k-sized heap operations; O(log n) per insert/extract',
      spaceComplexity: 'O(k) for bounded heap; O(n) for unbounded',
      commonMistakes: [
        'Using max-heap when min-heap is needed — remember: for k largest, you want a MIN-heap to efficiently evict smallest.',
        'Comparing tuples: Python heaps compare tuples lexicographically, so (priority, id, obj) works for tie-breaking.',
        'Not rebalancing two-heap sizes after push in the median problem.',
        'Forgetting heapify is O(n) — prefer it over n individual pushes when building from an existing list.',
      ],
    },
    {
      id: 'hashing',
      title: 'Hash Maps & Sets',
      difficulty: 'Easy',
      pattern: 'Hashing',
      companies: ['Amazon', 'Google', 'Facebook', 'Microsoft', 'Apple'],
      tags: ['HashMap', 'HashSet', 'Frequency Count', 'Prefix Sum', 'Grouping', 'Anagram'],
      overview: 'Hash maps and sets provide O(1) average-case insert, delete, and lookup. They are the go-to structure for "have we seen this before?", "count occurrences of X", and "group by property" patterns. Understanding when to use set vs map and how to use tuples as keys unlocks many problems.',
      problems: [
        { name: 'Two Sum', difficulty: 'Easy', note: 'Map: number → index; check if complement seen' },
        { name: 'Valid Anagram', difficulty: 'Easy', note: 'Compare character frequency counts' },
        { name: 'Group Anagrams', difficulty: 'Medium', note: 'Group by sorted string or tuple of char counts' },
        { name: 'Longest Consecutive Sequence', difficulty: 'Medium', note: 'Set for O(1) lookup; only start sequence at gap boundaries' },
        { name: 'Subarray Sum Equals K', difficulty: 'Medium', note: 'Prefix sum + map of seen prefix sums → count' },
        { name: 'Top K Frequent Elements', difficulty: 'Medium', note: 'Count with map, then heap or bucket sort by frequency' },
        { name: 'LRU Cache', difficulty: 'Medium', note: 'HashMap (key → node) + doubly linked list for O(1) all ops' },
        { name: 'Four Sum II', difficulty: 'Medium', note: 'Split into two halves, count pair sums in map' },
      ],
      approach: `Frequency counting:
from collections import Counter, defaultdict
count = Counter(arr)      # {value: frequency}
count = defaultdict(int)  # safer for missing keys

"Have we seen this before?":
seen = set()
for x in arr:
    if x in seen:   # O(1) lookup
        return True   # duplicate
    seen.add(x)

Prefix sum + hash map (subarray sum equals k):
prefix_count = {0: 1}   # base case: empty subarray has sum 0
prefix_sum = 0
result = 0
for num in arr:
    prefix_sum += num
    result += prefix_count.get(prefix_sum - k, 0)
    prefix_count[prefix_sum] = prefix_count.get(prefix_sum, 0) + 1

Grouping (anagrams):
groups = defaultdict(list)
for word in words:
    key = tuple(sorted(word))   # or tuple(Counter(word).items())
    groups[key].append(word)`,
      keyInsights: [
        'When you need O(1) lookup by value (not index), HashMap is the answer — convert from O(n) scan.',
        'Prefix sum + HashMap: for subarray problems counting/summing between indices. Key insight: sum[l..r] = prefix[r] - prefix[l-1].',
        'Use tuple as dict key to group by multiple properties — tuples are hashable, lists are not.',
        'HashSet for deduplication and membership; HashMap when you need an associated value (index, count, etc.).',
      ],
      timeComplexity: 'O(1) average for get/put/delete; O(n) worst case with many hash collisions',
      spaceComplexity: 'O(n) for n key-value pairs; O(1) if using fixed-size array (e.g., 26 letters)',
      commonMistakes: [
        'Using mutable types (list, dict) as dictionary keys — must convert to tuple first.',
        'Checking membership in a list (O(n)) instead of a set (O(1)).',
        'Modifying a dictionary while iterating over it — iterate over a copy.',
        'Not using .get(key, default) — direct dict[key] raises KeyError on missing keys.',
      ],
    },
    {
      id: 'stack-queue',
      title: 'Stack & Queue',
      difficulty: 'Easy',
      pattern: 'Stack / Monotonic Stack',
      companies: ['Amazon', 'Google', 'Microsoft', 'Bloomberg'],
      tags: ['Stack', 'Queue', 'Monotonic Stack', 'Next Greater', 'Balanced Parentheses', 'Deque'],
      overview: 'Stack (LIFO) and queue (FIFO) are fundamental structures. Beyond basic usage, the monotonic stack pattern — maintaining a stack in sorted order — solves "next greater/smaller element" problems in O(n). Deque enables O(1) operations at both ends, powering the sliding window maximum.',
      problems: [
        { name: 'Valid Parentheses', difficulty: 'Easy', note: 'Push open brackets, pop and match on close brackets' },
        { name: 'Min Stack', difficulty: 'Medium', note: 'Maintain parallel stack of minimums seen so far' },
        { name: 'Daily Temperatures', difficulty: 'Medium', note: 'Monotonic decreasing stack of indices' },
        { name: 'Next Greater Element I', difficulty: 'Easy', note: 'Monotonic stack + hash map for O(n)' },
        { name: 'Largest Rectangle in Histogram', difficulty: 'Hard', note: 'Monotonic increasing stack, compute area on pop' },
        { name: 'Implement Queue using Stacks', difficulty: 'Easy', note: 'Two stacks: inbox and outbox' },
        { name: 'Sliding Window Maximum', difficulty: 'Hard', note: 'Monotonic decreasing deque of indices' },
        { name: 'Decode String', difficulty: 'Medium', note: 'Stack of (partial_string, repeat_count)' },
      ],
      approach: `Monotonic stack (next greater element):
stack = []  # stores indices, maintains decreasing values
result = [-1] * len(nums)
for i, num in enumerate(nums):
    while stack and nums[stack[-1]] < num:
        idx = stack.pop()
        result[idx] = num   # num is next greater for nums[idx]
    stack.append(i)

Key: pop when invariant is violated. "Next greater" = pop when we see a larger element.
Monotonic DECREASING → solves "next greater"
Monotonic INCREASING → solves "next smaller"

Two-stack Queue (amortized O(1)):
inbox = []   # push here
outbox = []  # pop from here
def enqueue(x): inbox.append(x)
def dequeue():
    if not outbox:
        while inbox: outbox.append(inbox.pop())
    return outbox.pop()`,
      keyInsights: [
        'Monotonic stack: "next greater/smaller element" type problems — O(n) via one pass.',
        'Each element enters and exits the monotonic stack at most once → O(n) total despite the while loop.',
        'Two-stack queue: each element crosses from inbox to outbox exactly once → amortized O(1) dequeue.',
        'For "largest rectangle in histogram": treat each bar as potential minimum height, expand left/right using stack.',
      ],
      timeComplexity: 'O(n) for monotonic stack — each element pushed and popped at most once',
      spaceComplexity: 'O(n) for stack in worst case (sorted input)',
      commonMistakes: [
        'Forgetting to drain the stack after the main loop — remaining elements may have no next greater.',
        'Pushing values vs indices: for problems needing to compute spans or distances, push indices.',
        'Using list.pop(0) for queue operations in Python — it is O(n). Use collections.deque instead.',
        'Monotonic direction: increasing stack for "next smaller", decreasing for "next greater" — easy to mix up.',
      ],
    },
  ],
};
