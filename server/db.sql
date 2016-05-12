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
  `gift` tinyint(4) NOT NULL DEFAULT '0',
  `win` int(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;




CREATE TABLE `all_record` (
  record_id int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  uid int(11) NOT NULL,
  play_time timestamp NULL DEFAULT NULL,
  PRIMARY KEY (record_id)
) ENGINE=InnoDB AUTO_INCREMENT=600 DEFAULT CHARSET=utf8;