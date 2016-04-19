<?php
/**
 * 数据库接口
 * @authors Nemo (heady713@gmail.com)
 * @date    2016-04-12 12:55:46
 * @version $Id$
 */

require_once "medoo.php";

class DbService {
	/**
	 * private database connection
	 * @var [class medoo]
	 */
	private $db;

	/**
	 * construct function of class DbService
	 */
	public function __construct() {
		$this->db = new medoo([
			// required
			'database_type' => 'mysql',
			'database_name' => 'game_12306',
			'server' => 'localhost',
			'username' => 'root',
			'password' => 'tydic2016',
			// 'password' => 'ZQH4996197!=',
			'charset' => 'utf8',
			
			// [optional]
			'port' => 3306,
			
			// [optional] Table prefix
			// 'prefix' => 'PREFIX_',
			
			// driver_option for connection, read more from http://www.php.net/manual/en/pdo.setattribute.php
			'option' => [
				// PDO::ATTR_CASE => PDO::CASE_NATURAL
			]
		]);
	}

	/**
	 * return if has a database error
	 * @return boolean
	 */
	public function hasErr() {
		$error = $this->db->error();
		if (empty($error[2])) {
			return false;
		} else {
			// if (DEBUG_MODE) {
				var_dump($this->db->last_query());
				var_dump($this->db->error());
			// }
			return true;
		}
	}


	/**
	 * 总玩家数量
	 * @param  array $qry
	 * @param  ref array $ack
	 * @return boolean
	 */
	public function playerTotalCount(&$ack) {
		$cnt = $this->db->count("record");
		if ($this->hasErr()) {
			$ack["ret"] = 2;
			return false;
		}
		$ack["cnt"] = $cnt;
		$ack["ret"] = 0;
		return true;
	}


	/**
	 * 完成游戏记录
	 * @param  array $qry
	 * @param  ref array $ack
	 * @return boolean
	 */
	public function gameFinish($qry, &$ack) {
		if (!array_key_exists("total_time", $qry) ||
			!array_key_exists("gmf_times", $qry)) {
			$ack["ret"] = 1;
			return false;
		}
		$total_time = $qry["total_time"];
		$gmf_times  = $qry["gmf_times"];

		$uid = -1;
		if (array_key_exists("uid", $qry)) {
			//已有记录用户
			$uid  = $qry["uid"];

			$this->db->update("record", [
					"gmf_times[+]" => $gmf_times,
					"#modify_time" => "NOW()"
				], [
					"uid" => $uid
				]
			);
			if ($this->hasErr()) {
				$ack["ret"] = 2;
				return false;
			}

			$this->db->update("record", [
					"total_time" => $total_time
				], [
					"AND" => [
						"uid" => $uid,
						"total_time[>]" => $total_time
					]
				]
			);
			if ($this->hasErr()) {
				$ack["ret"] = 2;
				return false;
			}
		} else {
			//新用户
			$uid = $this->db->insert("record", [
					"gmf_times"    => $gmf_times,
					"total_time"   => $total_time,
					"#create_time" => "NOW()",
					"#modify_time" => "NOW()"
				]
			);
			if ($this->hasErr()) {
				$ack["ret"] = 2;
				return false;
			}
		}


		$results = $this->db->query(
			"SELECT count(a.uid)+1 AS rank_id, b.total_time, b.gmf_times " .
			"FROM record a, record b WHERE b.uid = " . $this->db->quote($uid) .
			" AND a.total_time < b.total_time;"
		)->fetchAll();
		if ($this->hasErr()) {
			$ack["ret"] = 2;
			return false;
		}
		$results = $results[0];

		$ack["uid"]        = $uid;
		$ack["gmf_times"]  = $results["gmf_times"];
		$ack["total_time"] = $results["total_time"];
		$ack["rank_id"]    = $results["rank_id"];

		$ack["ret"] = 0;
		return true;
	}

	/**
	 * 填写个人信息
	 * @param  array $qry
	 * @param  ref array $ack
	 * @return boolean
	 */
	public function playerInfo($qry, &$ack) {
		if (!array_key_exists("uid", $qry) || 
			!array_key_exists("phone_no", $qry) ||
			!array_key_exists("name", $qry)) {
			$ack["ret"] = 1;
			return false;
		}
		$uid      = $qry["uid"];
		$phone_no = $qry["phone_no"];
		$name     = $qry["name"];

		$this->db->update("record", [
				"phone_no" => $phone_no,
				"name" => $name,
				"#modify_time" => "NOW()"
			], [
				"uid" => $uid
			]
		);
		if ($this->hasErr()) {
			$ack["ret"] = 2;
			return false;
		}

		$ack["ret"] = 0;
		return true;
	}

}


?>