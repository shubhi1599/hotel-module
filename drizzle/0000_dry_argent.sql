CREATE TABLE "hotel_images" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"hotel_id" bigint NOT NULL,
	"url" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hotel_images_sort_order_positive" CHECK ("hotel_images"."sort_order" >= 1)
);
--> statement-breakpoint
CREATE TABLE "hotels" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"normalized_name" varchar(255) NOT NULL,
	"description" text,
	"address" varchar(500) NOT NULL,
	"city" varchar(255) NOT NULL,
	"country_code" varchar(2) NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"star_rating" smallint NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hotels_latitude_range" CHECK ("hotels"."latitude" BETWEEN -90 AND 90),
	CONSTRAINT "hotels_longitude_range" CHECK ("hotels"."longitude" BETWEEN -180 AND 180),
	CONSTRAINT "hotels_star_rating_range" CHECK ("hotels"."star_rating" BETWEEN 1 AND 5)
);
--> statement-breakpoint
ALTER TABLE "hotel_images" ADD CONSTRAINT "hotel_images_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "hotel_images_unique_url_per_hotel" ON "hotel_images" USING btree ("hotel_id","url");--> statement-breakpoint
CREATE UNIQUE INDEX "hotel_images_unique_sort_order_per_hotel" ON "hotel_images" USING btree ("hotel_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "hotel_images_one_primary_per_hotel" ON "hotel_images" USING btree ("hotel_id") WHERE "hotel_images"."is_primary" = true;--> statement-breakpoint
CREATE INDEX "hotel_images_hotel_id_sort_order_idx" ON "hotel_images" USING btree ("hotel_id","sort_order");--> statement-breakpoint
CREATE INDEX "hotels_active_normalized_name_idx" ON "hotels" USING btree ("normalized_name") WHERE "hotels"."is_active" = true;