CREATE DATABASE `game_12306`;


CREATE TABLE `record` (
  `uid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `total_time` float NOT NULL,
  `gmf_times` int(11) NOT NULL,
  `phone_no` bigint(20) DEFAULT NULL,
  `name` varchar(64) DEFAULT NULL,
  `create_time` timestamp NULL DEFAULT NULL,
  `modify_time` timestamp NULL DEFAULT NULL,
  `play_times` int(11) NOT NULL,
  PRIMARY KEY (`uid`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8;