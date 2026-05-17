ALTER TABLE `groups` ADD `is_system` integer NOT NULL DEFAULT 0;
UPDATE `groups` SET `is_system` = 1 WHERE `name` = '미설정';
UPDATE `groups` SET `name` = '미분류' WHERE `name` = '미설정';
